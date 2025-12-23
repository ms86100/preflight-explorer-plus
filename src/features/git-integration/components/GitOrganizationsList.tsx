import { useState } from 'react';
import { 
  GitBranch, 
  ExternalLink, 
  Trash2, 
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Copy,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useGitOrganizations, useDeleteGitOrganization, useUpdateGitOrganization } from '../hooks/useGitOrganizations';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { toast } from 'sonner';

const PROVIDER_ICONS: Record<string, string> = {
  gitlab: '🦊',
  github: '🐙',
  bitbucket: '🪣',
};

const PROVIDER_COLORS: Record<string, string> = {
  gitlab: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  github: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  bitbucket: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export function GitOrganizationsList() {
  const { data: organizations, isLoading, refetch } = useGitOrganizations();
  const deleteOrg = useDeleteGitOrganization();
  const updateOrg = useUpdateGitOrganization();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteOrg.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateOrg.mutateAsync({ id, is_active: !currentActive });
  };

  const copyWebhookUrl = (orgId: string) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const provider = organizations?.find(o => o.id === orgId)?.provider_type || 'gitlab';
    const webhookUrl = `${baseUrl}/functions/v1/git-webhook/${provider}/${orgId}`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organizations?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No Git providers connected</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Connect your GitLab, GitHub, or Bitbucket to start linking commits and pull requests to issues.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {organizations.map((org) => (
          <Card key={org.id} className={org.is_active ? '' : 'opacity-60'}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{PROVIDER_ICONS[org.provider_type] || '📁'}</span>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {org.name}
                      <Badge variant="outline" className={PROVIDER_COLORS[org.provider_type]}>
                        {org.provider_type}
                      </Badge>
                      {!org.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <a 
                        href={org.host_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {org.host_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyWebhookUrl(org.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Webhook URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(org.id, org.is_active ?? true)}>
                      {org.is_active === false ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteId(org.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <SyncStatusIndicator organization={org} onSyncComplete={() => refetch()} />

                <div className="text-muted-foreground">
                  Created {new Date(org.created_at || '').toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Git Connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all linked repositories and their commit/PR history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrg.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
