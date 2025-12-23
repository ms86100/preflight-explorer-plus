// Trigger Build Modal Component
// Modal for manually triggering CI/CD builds

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Play, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGitModalRepositories } from '../hooks/useGitModalRepositories';
import type { GitBranch } from '../types';

const formSchema = z.object({
  repository_id: z.string().min(1, 'Repository is required'),
  ref: z.string().min(1, 'Branch/ref is required'),
  workflow_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TriggerBuildModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly projectId: string;
  readonly branches?: readonly GitBranch[];
  readonly onSuccess?: () => void;
}

export function TriggerBuildModal({
  open,
  onOpenChange,
  projectId,
  branches = [],
  onSuccess,
}: TriggerBuildModalProps) {
  const { repositories, loading: loadingRepos, loadRepositories } = useGitModalRepositories();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repository_id: '',
      ref: 'main',
      workflow_id: '',
    },
  });

  useEffect(() => {
    if (open) {
      loadRepositories(projectId);
      form.reset({
        repository_id: '',
        ref: 'main',
        workflow_id: '',
      });
    }
  }, [open, projectId, loadRepositories, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const repository = repositories.find(r => r.id === data.repository_id);
      if (!repository) throw new Error('Repository not found');

      // Call the git-api edge function to trigger build
      const { data: result, error } = await supabase.functions.invoke('git-api/trigger-build', {
        body: {
          organization_id: repository.organization_id,
          repository_slug: repository.slug,
          ref: data.ref,
          workflow_id: data.workflow_id || undefined,
        },
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Failed to trigger build');

      toast.success('Build triggered successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to trigger build:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to trigger build');
    } finally {
      setLoading(false);
    }
  };

  const selectedRepo = repositories.find(r => r.id === form.watch('repository_id'));
  const providerType = selectedRepo?.organization?.provider_type;
  const repoBranches = branches.filter(b => b.repository_id === selectedRepo?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Trigger Build
          </DialogTitle>
          <DialogDescription>
            Manually trigger a CI/CD pipeline run
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="repository_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingRepos}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingRepos ? 'Loading...' : 'Select repository'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {repositories.map((repo) => (
                        <SelectItem key={repo.id} value={repo.id}>
                          {repo.name}
                          {repo.organization && (
                            <span className="text-muted-foreground ml-2">
                              ({repo.organization.provider_type})
                            </span>
                          )}
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
              name="ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch / Ref</FormLabel>
                  {repoBranches.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={selectedRepo?.default_branch || 'main'}>
                          {selectedRepo?.default_branch || 'main'} (default)
                        </SelectItem>
                        {repoBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder={selectedRepo?.default_branch || 'main'} {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {providerType === 'github' && (
              <FormField
                control={form.control}
                name="workflow_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ci.yml" {...field} />
                    </FormControl>
                    <FormDescription>
                      GitHub workflow file name. Defaults to ci.yml
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {providerType === 'bitbucket' && (
              <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                <Wrench className="h-4 w-4 inline mr-2" />
                Build triggering is not yet supported for Bitbucket
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || repositories.length === 0 || providerType === 'bitbucket'}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Play className="mr-2 h-4 w-4" />
                Trigger Build
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
