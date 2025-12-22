import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useTeamsByProject(projectId: string) {
  return useQuery({
    queryKey: ['project-teams', projectId],
    queryFn: () => teamService.getTeamsByProject(projectId),
    enabled: !!projectId,
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamService.getTeamMembers(teamId),
    enabled: !!teamId,
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => teamService.getAllProjectMembers(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: { projectId: string; name: string; description?: string }) =>
      teamService.createTeam(params.projectId, params.name, params.description, user?.id || ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-teams', variables.projectId] });
      toast.success('Team created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create team');
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { teamId: string; projectId: string; updates: { name?: string; description?: string } }) =>
      teamService.updateTeam(params.teamId, params.updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-teams', variables.projectId] });
      toast.success('Team updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update team');
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { teamId: string; projectId: string }) =>
      teamService.deleteTeam(params.teamId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-teams', variables.projectId] });
      toast.success('Team deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete team');
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: { teamId: string; userId: string; role: 'lead' | 'member' }) =>
      teamService.addTeamMember(params.teamId, params.userId, params.role, user?.id || ''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', variables.teamId] });
      toast.success('Member added to team');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { memberId: string; teamId: string; role: 'lead' | 'member' }) =>
      teamService.updateMemberRole(params.memberId, params.role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', variables.teamId] });
      toast.success('Member role updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { memberId: string; teamId: string }) =>
      teamService.removeTeamMember(params.memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', variables.teamId] });
      toast.success('Member removed from team');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });
}
