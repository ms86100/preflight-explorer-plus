import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserWithRole {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'moderator' | 'user' | null;
  created_at: string;
}

export function AccessControlManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, created_at')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Get user roles - using type assertion for table not in current schema
      const { data: roles, error: roleError } = await (supabase.from as any)('user_roles')
        .select('user_id, role');

      if (roleError) throw roleError;

      const roleMap = new Map((roles as any[] || []).map((r: any) => [r.user_id, r.role]));

      return profiles?.map(p => ({
        ...p,
        role: roleMap.get(p.id) || null
      })) as UserWithRole[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' | null }) => {
      if (role === null) {
        // Remove all roles for this user - using type assertion for table not in current schema
        const { error } = await (supabase.from as any)('user_roles')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // First delete existing roles, then insert new one
        await (supabase.from as any)('user_roles')
          .delete()
          .eq('user_id', userId);
        
        const { error } = await (supabase.from as any)('user_roles')
          .insert([{ user_id: userId, role }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'none' && !user.role) ||
      user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const variants: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      moderator: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    
    return (
      <Badge className={variants[role] || ''}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Control
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions. Administrators have full access to all features including this panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Role Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-400">Administrators</p>
                    <p className="text-2xl font-bold text-red-400">
                      {users?.filter(u => u.role === 'admin').length || 0}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-400">Moderators</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {users?.filter(u => u.role === 'moderator').length || 0}
                    </p>
                  </div>
                  <UserPlus className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400">Standard Users</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {users?.filter(u => u.role === 'user').length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="user">Standard Users</SelectItem>
                <SelectItem value="none">No Role Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.display_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.role || 'none'} 
                          onValueChange={(value) => 
                            updateRoleMutation.mutate({ 
                              userId: user.id, 
                              role: value === 'none' ? null : value as 'admin' | 'moderator' | 'user'
                            })
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Role</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>What each role can access</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead className="text-center">User</TableHead>
                <TableHead className="text-center">Moderator</TableHead>
                <TableHead className="text-center">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'View Projects & Issues', user: true, mod: true, admin: true },
                { name: 'Create & Edit Issues', user: true, mod: true, admin: true },
                { name: 'Manage Sprints', user: false, mod: true, admin: true },
                { name: 'Configure Workflows', user: false, mod: true, admin: true },
                { name: 'Access Reports', user: false, mod: true, admin: true },
                { name: 'View Audit Logs', user: false, mod: false, admin: true },
                { name: 'Manage Users & Roles', user: false, mod: false, admin: true },
                { name: 'Configure System Settings', user: false, mod: false, admin: true },
              ].map((perm, i) => (
                <TableRow key={i}>
                  <TableCell>{perm.name}</TableCell>
                  <TableCell className="text-center">
                    {perm.user ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {perm.mod ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {perm.admin ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}