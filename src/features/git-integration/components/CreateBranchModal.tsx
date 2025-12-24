// Create Branch Modal Component
// Modal for creating a new branch linked to an issue

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, GitBranch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGitModalRepositories } from '../hooks/useGitModalRepositories';

const formSchema = z.object({
  repository_id: z.string().min(1, 'Repository is required'),
  branch_name: z.string().min(1, 'Branch name is required').regex(/^[a-zA-Z0-9/_-]+$/, 'Invalid branch name'),
  from_branch: z.string().min(1, 'Source branch is required'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateBranchModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly issueKey: string;
  readonly issueId: string;
  readonly projectId: string;
  readonly onSuccess?: () => void;
}

export function CreateBranchModal({
  open,
  onOpenChange,
  issueKey,
  issueId,
  projectId,
  onSuccess,
}: CreateBranchModalProps) {
  const { repositories, loading: loadingRepos, loadRepositories } = useGitModalRepositories();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repository_id: '',
      branch_name: `feature/${issueKey.toLowerCase()}`,
      from_branch: 'main',
    },
  });

  // Load repositories when modal opens
  useEffect(() => {
    if (open && projectId) {
      loadRepositories(projectId);
      form.reset({
        repository_id: '',
        branch_name: `feature/${issueKey.toLowerCase()}`,
        from_branch: 'main',
      });
    }
  }, [open, projectId, issueKey]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const repository = repositories.find(r => r.id === data.repository_id);
      if (!repository) throw new Error('Repository not found');

      // Call the git-api edge function to create branch
      const { data: result, error } = await supabase.functions.invoke('git-api/create-branch', {
        body: {
          organization_id: repository.organization_id,
          repository_slug: repository.slug,
          branch_name: data.branch_name,
          from_branch: data.from_branch,
        },
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Failed to create branch');

      // Save branch to database
      await supabase.from('git_branches').insert({
        repository_id: repository.id,
        issue_id: issueId,
        name: data.branch_name,
        web_url: result.web_url,
      });

      toast.success('Branch created successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const selectedRepo = repositories.find(r => r.id === form.watch('repository_id'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Create Branch
          </DialogTitle>
          <DialogDescription>
            Create a new branch linked to {issueKey}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Show helpful message when no repositories are linked */}
            {!loadingRepos && repositories.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <GitBranch className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No repositories linked to this project
                </p>
                <p className="text-xs text-muted-foreground">
                  Go to <span className="font-medium text-primary">Plugins → Git Integration → Repositories</span> to link a repository first.
                </p>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="repository_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingRepos || repositories.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingRepos 
                            ? 'Loading...' 
                            : repositories.length === 0 
                              ? 'No repositories available' 
                              : 'Select repository'
                        } />
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

            <FormField
              control={form.control}
              name="from_branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Branch</FormLabel>
                  <FormControl>
                    <Input placeholder={selectedRepo?.default_branch || 'main'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="feature/PROJ-123" {...field} />
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
                Create Branch
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
