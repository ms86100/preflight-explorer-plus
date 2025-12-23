import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  Plus, 
  Pencil,
  CheckCircle2,
  Users,
  Lock
} from 'lucide-react';

const PERMISSION_KEYS = [
  { key: 'browse_project', label: 'Browse Project', description: 'View project and its issues' },
  { key: 'create_issue', label: 'Create Issues', description: 'Create new issues in the project' },
  { key: 'edit_issue', label: 'Edit Issues', description: 'Edit existing issues' },
  { key: 'delete_issue', label: 'Delete Issues', description: 'Delete issues from the project' },
  { key: 'comment_issue', label: 'Add Comments', description: 'Add comments to issues' },
  { key: 'attach_files', label: 'Attach Files', description: 'Upload attachments to issues' },
  { key: 'log_work', label: 'Log Work', description: 'Log work time on issues' },
  { key: 'manage_sprints', label: 'Manage Sprints', description: 'Create and manage sprints' },
  { key: 'administer_project', label: 'Administer Project', description: 'Full project administration' },
];

interface PermissionScheme {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

interface PermissionGrant {
  id: string;
  scheme_id: string;
  permission_key: string;
  grant_type: string;
  role_id: string | null;
  group_id: string | null;
  user_id: string | null;
}

export function PermissionSchemesManager() {
  const { data: schemes, isLoading: schemesLoading } = useQuery({
    queryKey: ['permission-schemes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_schemes')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as PermissionScheme[];
    },
  });

  const { data: grants } = useQuery({
    queryKey: ['permission-grants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_scheme_grants')
        .select('*');
      if (error) throw error;
      return data as PermissionGrant[];
    },
  });

  const getGrantsForScheme = (schemeId: string) => {
    return grants?.filter(g => g.scheme_id === schemeId) || [];
  };

  const getGrantTypeLabel = (type: string) => {
    switch (type) {
      case 'anyone': return 'Anyone';
      case 'logged_in': return 'Logged In Users';
      case 'role': return 'Project Role';
      case 'group': return 'Group';
      case 'user': return 'Specific User';
      default: return type;
    }
  };

  if (schemesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Schemes
          </CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Scheme
          </Button>
        </CardHeader>
        <CardContent>
          {schemes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No permission schemes configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schemes?.map(scheme => (
                <Card key={scheme.id} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{scheme.name}</span>
                        {scheme.is_default && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {scheme.description && (
                      <p className="text-sm text-muted-foreground">{scheme.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Permission</TableHead>
                          <TableHead>Granted To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {PERMISSION_KEYS.map(perm => {
                          const schemeGrants = getGrantsForScheme(scheme.id)
                            .filter(g => g.permission_key === perm.key);
                          
                          return (
                            <TableRow key={perm.key}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{perm.label}</div>
                                  <div className="text-xs text-muted-foreground">{perm.description}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {schemeGrants.length === 0 ? (
                                    <Badge variant="outline" className="text-muted-foreground">
                                      No grants
                                    </Badge>
                                  ) : (
                                    schemeGrants.map(grant => (
                                      <Badge key={grant.id} variant="secondary">
                                        <Users className="h-3 w-3 mr-1" />
                                        {getGrantTypeLabel(grant.grant_type)}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
