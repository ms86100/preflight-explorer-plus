// Git User Mapping Manager Component
// UI for mapping Git authors (by email) to system users

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, Link2, Unlink, Search, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GitUserMapping {
  id: string;
  organization_id: string;
  git_email: string;
  git_name: string | null;
  user_id: string | null;
  is_verified: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
}

interface UnmappedAuthor {
  git_email: string;
  git_name: string | null;
  commit_count: number;
}

export function GitUserMappingManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch existing mappings
  const { data: mappings, isLoading: loadingMappings } = useQuery({
    queryKey: ['git-user-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('git_user_mappings')
        .select('*')
        .order('git_email');
      if (error) throw error;
      return data as GitUserMapping[];
    },
  });

  // Fetch all profiles for mapping
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-mapping'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .order('display_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch unmapped authors from commits
  const { data: unmappedAuthors, isLoading: loadingAuthors } = useQuery({
    queryKey: ['unmapped-git-authors'],
    queryFn: async () => {
      // Get unique authors from commits that don't have mappings
      const { data, error } = await supabase
        .from('git_commits')
        .select('author_email, author_name')
        .not('author_email', 'is', null);
      
      if (error) throw error;

      // Count commits per author
      const authorCounts = new Map<string, { name: string | null; count: number }>();
      for (const commit of data || []) {
        if (commit.author_email) {
          const existing = authorCounts.get(commit.author_email);
          if (existing) {
            existing.count++;
          } else {
            authorCounts.set(commit.author_email, { 
              name: commit.author_name, 
              count: 1 
            });
          }
        }
      }

      // Filter out already mapped emails
      const mappedEmails = new Set(mappings?.map(m => m.git_email) || []);
      const unmapped: UnmappedAuthor[] = [];
      
      authorCounts.forEach((value, email) => {
        if (!mappedEmails.has(email)) {
          unmapped.push({
            git_email: email,
            git_name: value.name,
            commit_count: value.count,
          });
        }
      });

      return unmapped.sort((a, b) => b.commit_count - a.commit_count);
    },
    enabled: !!mappings,
  });

  // Create mapping mutation
  const createMapping = useMutation({
    mutationFn: async ({ git_email, git_name, user_id }: { 
      git_email: string; 
      git_name: string | null;
      user_id: string | null;
    }) => {
      const { error } = await supabase
        .from('git_user_mappings')
        .insert({
          git_email,
          git_name,
          user_id,
          is_verified: !!user_id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-user-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['unmapped-git-authors'] });
      toast.success('User mapping created');
    },
    onError: (error) => {
      toast.error('Failed to create mapping: ' + (error as Error).message);
    },
  });

  // Update mapping mutation
  const updateMapping = useMutation({
    mutationFn: async ({ id, user_id }: { id: string; user_id: string | null }) => {
      const { error } = await supabase
        .from('git_user_mappings')
        .update({ user_id, is_verified: !!user_id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-user-mappings'] });
      toast.success('User mapping updated');
    },
    onError: (error) => {
      toast.error('Failed to update mapping: ' + (error as Error).message);
    },
  });

  // Delete mapping mutation
  const deleteMapping = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('git_user_mappings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-user-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['unmapped-git-authors'] });
      toast.success('User mapping removed');
    },
    onError: (error) => {
      toast.error('Failed to remove mapping: ' + (error as Error).message);
    },
  });

  const getProfileName = (userId: string | null) => {
    if (!userId) return null;
    const profile = profiles?.find(p => p.id === userId);
    return profile?.display_name || profile?.email || 'Unknown';
  };

  const filteredMappings = mappings?.filter(m =>
    m.git_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.git_name && m.git_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUnmapped = unmappedAuthors?.filter(a =>
    a.git_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.git_name && a.git_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loadingMappings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Git User Mappings
          </CardTitle>
          <CardDescription>
            Map Git commit authors to system users for better attribution and tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Unmapped Authors Section */}
          {filteredUnmapped && filteredUnmapped.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Unmapped Authors ({filteredUnmapped.length})
              </h4>
              <ScrollArea className="h-[200px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Git Author</TableHead>
                      <TableHead>Commits</TableHead>
                      <TableHead className="w-[200px]">Map to User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnmapped.map((author) => (
                      <UnmappedAuthorRow
                        key={author.git_email}
                        author={author}
                        profiles={profiles || []}
                        onMap={(userId) => createMapping.mutate({
                          git_email: author.git_email,
                          git_name: author.git_name,
                          user_id: userId,
                        })}
                        isLoading={createMapping.isPending}
                      />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Existing Mappings */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              Mapped Users ({filteredMappings?.length || 0})
            </h4>
            {filteredMappings && filteredMappings.length > 0 ? (
              <ScrollArea className="h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Git Author</TableHead>
                      <TableHead>Mapped User</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMappings.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{mapping.git_name || 'Unknown'}</span>
                            <span className="text-sm text-muted-foreground block">
                              {mapping.git_email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping.user_id || 'none'}
                            onValueChange={(value) => updateMapping.mutate({
                              id: mapping.id,
                              user_id: value === 'none' ? null : value,
                            })}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No mapping</SelectItem>
                              {profiles?.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.display_name || profile.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMapping.mutate(mapping.id)}
                            disabled={deleteMapping.isPending}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No user mappings yet. Map Git authors above to link them with system users.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-component for unmapped author row
function UnmappedAuthorRow({
  author,
  profiles,
  onMap,
  isLoading,
}: {
  readonly author: UnmappedAuthor;
  readonly profiles: readonly Profile[];
  onMap: (userId: string | null) => void;
  isLoading: boolean;
}) {
  const [selectedUser, setSelectedUser] = useState<string>('');

  // Auto-suggest based on email match
  useEffect(() => {
    const matchingProfile = profiles.find(
      p => p.email.toLowerCase() === author.git_email.toLowerCase()
    );
    if (matchingProfile) {
      setSelectedUser(matchingProfile.id);
    }
  }, [author.git_email, profiles]);

  return (
    <TableRow>
      <TableCell>
        <div>
          <span className="font-medium">{author.git_name || 'Unknown'}</span>
          <span className="text-sm text-muted-foreground block">{author.git_email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{author.commit_count}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.display_name || profile.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => onMap(selectedUser || null)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
