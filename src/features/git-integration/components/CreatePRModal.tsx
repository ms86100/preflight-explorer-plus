// Create Pull Request Modal Component
// Modal for creating a new pull request linked to an issue

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, GitPullRequest } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { GitRepository, GitBranch } from '../types';

const formSchema = z.object({
  repository_id: z.string().min(1, 'Repository is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  source_branch: z.string().min(1, 'Source branch is required'),
  target_branch: z.string().min(1, 'Target branch is required'),
});

type FormData = z.infer<typeof formSchema>;

interface CreatePRModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly issueKey: string;
  readonly issueId: string;
  readonly projectId: string;
  readonly branches?: readonly GitBranch[];
  readonly onSuccess?: () => void;
}

export function CreatePRModal({
  open,
  onOpenChange,
  issueKey,
  issueId,
  projectId,
  branches = [],
  onSuccess,
}: CreatePRModalProps) {
  const [repositories, setRepositories] = useState<GitRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repository_id: '',
      title: `${issueKey}: `,
      description: '',
      source_branch: '',
      target_branch: 'main',
    },
  });

  // Load repositories when modal opens
  const loadRepositories = async () => {
    setLoadingRepos(true);
    try {
      const { data, error } = await supabase
        .from('git_repositories')
        .select('*, organization:git_organizations(*)')
        .eq('project_id', projectId)
        .eq('is_active', true);
      
      if (error) throw error;
      setRepositories(data as unknown as GitRepository[]);
    } catch (error) {
      console.error('Failed to load repositories:', error);
      toast.error('Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadRepositories();
      // Pre-fill source branch if there's an issue branch
      const issueBranch = branches.find(b => b.name.toLowerCase().includes(issueKey.toLowerCase()));
      form.reset({
        repository_id: issueBranch?.repository_id || '',
        title: `${issueKey}: `,
        description: '',
        source_branch: issueBranch?.name || '',
        target_branch: 'main',
      });
    }
  }, [open, issueKey, branches]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const repository = repositories.find(r => r.id === data.repository_id);
      if (!repository) throw new Error('Repository not found');

      // Call the git-api edge function to create PR
      const { data: result, error } = await supabase.functions.invoke('git-api/create-pr', {
        body: {
          organization_id: repository.organization_id,
          repository_slug: repository.slug,
          title: data.title,
          body: data.description || '',
          head_branch: data.source_branch,
          base_branch: data.target_branch,
        },
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Failed to create PR');

      // Save PR to database
      const { data: prData, error: prError } = await supabase.from('git_pull_requests').insert({
        repository_id: repository.id,
        remote_id: result.pr_id || result.mr_id || 'unknown',
        title: data.title,
        description: data.description,
        source_branch: data.source_branch,
        destination_branch: data.target_branch,
        status: 'open',
        web_url: result.web_url,
      }).select().single();

      if (prError) throw prError;

      // Link PR to issue
      await supabase.from('git_pull_request_issues').insert({
        pull_request_id: prData.id,
        issue_id: issueId,
        issue_key: issueKey,
      });

      toast.success('Pull request created successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create PR:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    } finally {
      setLoading(false);
    }
  };

  const selectedRepo = repositories.find(r => r.id === form.watch('repository_id'));
  const repoBranches = branches.filter(b => b.repository_id === selectedRepo?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Create Pull Request
          </DialogTitle>
          <DialogDescription>
            Create a new pull request linked to {issueKey}
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
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source_branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Branch</FormLabel>
                    {repoBranches.length > 0 ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {repoBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.name}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input placeholder="feature/branch-name" {...field} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Branch</FormLabel>
                    <FormControl>
                      <Input placeholder={selectedRepo?.default_branch || 'main'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="PR Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the changes..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || repositories.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Pull Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
