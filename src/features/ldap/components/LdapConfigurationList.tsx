import { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LdapConfiguration } from '../types';
import { fetchLdapConfigurations, deleteLdapConfiguration } from '../services/ldapService';

interface LdapConfigurationListProps {
  readonly onSelect: (config: LdapConfiguration) => void;
  readonly onNew: () => void;
}

export function LdapConfigurationList({ onSelect, onNew }: LdapConfigurationListProps) {
  const [configurations, setConfigurations] = useState<LdapConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      const configs = await fetchLdapConfigurations();
      setConfigurations(configs);
    } catch (error) {
      toast.error('Failed to load LDAP configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteLdapConfiguration(deleteId);
      setConfigurations(configurations.filter(c => c.id !== deleteId));
      toast.success('Configuration deleted');
    } catch (error) {
      toast.error('Failed to delete configuration');
    } finally {
      setDeleteId(null);
    }
  };

  const getSyncStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    switch (status) {
      case 'completed':
      case 'connection_test_passed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> OK</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'completed_with_errors':
        return <Badge variant="secondary">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">LDAP/AD Configurations</h2>
          <p className="text-sm text-muted-foreground">
            Manage directory server connections for group synchronization
          </p>
        </div>
        <Button onClick={onNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      {configurations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No LDAP Configurations</h3>
                <p className="text-sm text-muted-foreground">
                  Add an LDAP or Active Directory configuration to sync groups and roles
                </p>
              </div>
              <Button onClick={onNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configurations.map((config) => (
            <Card 
              key={config.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onSelect(config)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {config.name}
                      {!config.is_active && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{config.server_url}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {getSyncStatusBadge(config.last_sync_status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(config.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Base DN:</span> {config.base_dn}
                  </div>
                  <div>
                    <span className="font-medium">Port:</span> {config.port}
                  </div>
                  <div>
                    <span className="font-medium">SSL:</span> {config.use_ssl ? 'Yes' : 'No'}
                  </div>
                  {config.last_sync_at && (
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      <span>Last sync: {format(new Date(config.last_sync_at), 'MMM d, HH:mm')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete LDAP Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the configuration and all associated group mappings.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
