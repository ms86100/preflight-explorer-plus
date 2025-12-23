import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Loader2, 
  Link as LinkIcon, 
  ExternalLink,
  GitBranch,
  Trash2,
  RefreshCw,
  Search,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGitOrganizations } from '../hooks/useGitOrganizations';
import { useGitRepositories, useCreateGitRepository, useUpdateGitRepository, useDeleteGitRepository } from '../hooks/useGitRepositories';
import { useProjects } from '@/features/projects';
import { RepositorySettingsModal } from './RepositorySettingsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GitRepository } from '../types';

interface DiscoveredRepo {
  readonly id: string;
  readonly name: string;
  readonly full_name: string;
  readonly description?: string;
  readonly web_url: string;
  readonly clone_url?: string;
  readonly default_branch: string;
  readonly private: boolean;
}

const formSchema = z.object({
  organization_id: z.string().min(1, 'Organization is required'),
  project_id: z.string().min(1, 'Project is required'),
  repository: z.string().min(1, 'Repository is required'),
  smartcommits_enabled: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const getRepoItemClassName = (isSelected: boolean, isLinked: boolean): string => {
  const base = 'flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors';
  if (isSelected) return `${base} bg-primary/10 border border-primary`;
  if (isLinked) return `${base} opacity-50 cursor-not-allowed bg-muted`;
  return `${base} hover:bg-muted`;
};

export function RepositoryLinker() {
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [settingsRepo, setSettingsRepo] = useState<GitRepository | null>(null);
  const [discoveredRepos, setDiscoveredRepos] = useState<DiscoveredRepo[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: organizations } = useGitOrganizations();
  const { data: repositories, isLoading, refetch } = useGitRepositories();
  const { data: projects } = useProjects();
  const createRepo = useCreateGitRepository();
  const updateRepo = useUpdateGitRepository();
  const deleteRepo = useDeleteGitRepository();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization_id: '',
      project_id: '',
      repository: '',
      smartcommits_enabled: true,
    },
  });

  const selectedOrgId = form.watch('organization_id');

  // Fetch repositories when organization changes
  useEffect(() => {
    if (selectedOrgId) {
      discoverRepositories(selectedOrgId);
    } else {
      setDiscoveredRepos([]);
    }
  }, [selectedOrgId]);

  const discoverRepositories = async (orgId: string) => {
    setIsDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('git-api/repositories', {
        body: { organization_id: orgId },
      });

      if (error) throw error;
      setDiscoveredRepos(data.repositories || []);
    } catch (err) {
      console.error('Failed to discover repositories:', err);
      toast.error('Failed to fetch repositories from Git provider');
      setDiscoveredRepos([]);
    } finally {
      setIsDiscovering(false);
    }
  };

  const filteredRepos = discoveredRepos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (values: FormValues) => {
    const selectedRepo = discoveredRepos.find(r => r.id === values.repository);
    if (!selectedRepo) {
      toast.error('Please select a repository');
      return;
    }

    await createRepo.mutateAsync({
      organization_id: values.organization_id,
      project_id: values.project_id,
      remote_id: selectedRepo.id,
      name: selectedRepo.name,
      slug: selectedRepo.full_name,
      web_url: selectedRepo.web_url,
      clone_url: selectedRepo.clone_url,
      default_branch: selectedRepo.default_branch,
      smartcommits_enabled: values.smartcommits_enabled,
    });
    form.reset();
    setDiscoveredRepos([]);
    setSearchTerm('');
    setOpen(false);
  };

  const handleToggleSmartCommits = async (repoId: string, currentValue: boolean) => {
    await updateRepo.mutateAsync({ id: repoId, smartcommits_enabled: !currentValue });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRepo.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return 'Unlinked';
    const project = projects?.find(p => p.id === projectId);
    return project ? `${project.pkey} - ${project.name}` : 'Unknown';
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return 'Unknown';
    const org = organizations?.find(o => o.id === orgId);
    return org?.name || 'Unknown';
  };

  // Check if a repo is already linked
  const isRepoLinked = (remoteId: string) => {
    return repositories?.some(r => r.remote_id === remoteId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Linked Repositories</h3>
          <p className="text-sm text-muted-foreground">
            Repositories linked to projects for commit and PR tracking.
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            form.reset();
            setDiscoveredRepos([]);
            setSearchTerm('');
          }
        }}>
          <DialogTrigger asChild>
            <Button disabled={!organizations?.length}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Link Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Link Repository</DialogTitle>
              <DialogDescription>
                Select a repository from your Git provider to link with a project.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organization_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Git Provider</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations?.filter(o => o.is_active).map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name} ({org.provider_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.pkey} - {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedOrgId && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel>Repository</FormLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => discoverRepositories(selectedOrgId)}
                        disabled={isDiscovering}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isDiscovering ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search repositories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="repository"
                      render={({ field }) => (
                        <FormItem>
                          <ScrollArea className="h-[200px] border rounded-md">
                            {isDiscovering ? (
                              <div className="flex items-center justify-center h-full py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : filteredRepos.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                                <GitBranch className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">
                                  {searchTerm ? 'No matching repositories' : 'No repositories found'}
                                </p>
                              </div>
                            ) : (
                              <div className="p-2 space-y-1">
                                {filteredRepos.map((repo) => {
                                  const linked = isRepoLinked(repo.id);
                                  return (
                                    <button
                                      key={repo.id}
                                      type="button"
                                      disabled={linked}
                                      className={getRepoItemClassName(field.value === repo.id, linked)}
                                      onClick={() => {
                                        if (!linked) {
                                          field.onChange(repo.id);
                                        }
                                      }}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium truncate">{repo.name}</span>
                                          {repo.private && (
                                            <Badge variant="outline" className="text-xs">Private</Badge>
                                          )}
                                          {linked && (
                                            <Badge variant="secondary" className="text-xs">Linked</Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {repo.full_name}
                                        </p>
                                      </div>
                                      {repo.web_url && (
                                        <a
                                          href={repo.web_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-muted-foreground hover:text-foreground ml-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </ScrollArea>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="smartcommits_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-base">Smart Commits</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Parse commit messages for issue keys and commands
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRepo.isPending || !form.watch('repository')}>
                    {createRepo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Link Repository
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {repositories?.length ? (
        <div className="space-y-3">
          {repositories.map((repo) => (
            <Card key={repo.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{repo.name}</span>
                      {repo.web_url && (
                        <a
                          href={repo.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{getOrgName(repo.organization_id)}</span>
                      <span>→</span>
                      <Badge variant="secondary" className="font-normal">
                        {getProjectName(repo.project_id ?? null)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={repo.smartcommits_enabled ?? true}
                      onCheckedChange={() => handleToggleSmartCommits(repo.id, repo.smartcommits_enabled ?? true)}
                    />
                    <span className="text-sm text-muted-foreground">Smart commits</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSettingsRepo(repo as unknown as GitRepository)}
                    className="h-8 w-8"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(repo.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No repositories linked</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {organizations?.length
                ? 'Link repositories to projects to start tracking commits and pull requests.'
                : 'Add a Git provider first, then link repositories to projects.'}
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between this repository and the project. Commit and PR history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRepo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RepositorySettingsModal
        open={!!settingsRepo}
        onOpenChange={(open) => !open && setSettingsRepo(null)}
        repository={settingsRepo}
        onSuccess={() => refetch()}
      />
    </>
  );
}
