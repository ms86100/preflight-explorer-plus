import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, type ProjectInsert } from '../services/projectService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });
}

export function useProject(pkey: string) {
  return useQuery({
    queryKey: ['project', pkey],
    queryFn: () => projectService.getByKey(pkey),
    enabled: !!pkey,
  });
}

export function useProjectById(id: string) {
  return useQuery({
    queryKey: ['project', 'id', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (project: ProjectInsert) => {
      if (!user?.id) throw new Error('User not authenticated');
      return projectService.create(project, user.id);
    },
    onSuccess: async (data) => {
      // Invalidate and wait for refetch to complete before navigation can proceed
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Also prefetch the specific project and its boards to ensure data is available
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['project', data.pkey],
          queryFn: () => projectService.getByKey(data.pkey),
        }),
        queryClient.prefetchQuery({
          queryKey: ['boards', 'project', data.id],
          queryFn: async () => {
            const { boardService } = await import('@/features/boards/services/boardService');
            return boardService.getByProject(data.id);
          },
        }),
      ]);
      toast.success(`Project "${data.name}" created successfully!`);
    },
    onError: (error: Error & { code?: string; message?: string }) => {
      // Check for unique constraint violation on project key
      const errorMessage = error?.message?.toLowerCase() || '';
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || 
          errorMessage.includes('pkey') || errorMessage.includes('projects_pkey_key')) {
        toast.error('A project with this key already exists', {
          description: 'Please choose a different project key. The key may be in use by an active or archived project.',
        });
      } else {
        toast.error('Failed to create project', {
          description: 'Please check your input and try again.',
        });
      }
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectInsert> }) =>
      projectService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data.pkey] });
      toast.success('Project updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update project. Please try again.');
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project archived successfully!');
    },
    onError: () => {
      toast.error('Failed to archive project. Please try again.');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project and all associated data deleted permanently!');
    },
    onError: () => {
      toast.error('Failed to delete project. Please try again.');
    },
  });
}
