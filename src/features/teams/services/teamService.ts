import { supabase } from '@/integrations/supabase/client';
import type { ProjectTeam, ProjectTeamMember } from '../types';

export const teamService = {
  async getTeamsByProject(projectId: string): Promise<ProjectTeam[]> {
    const { data, error } = await supabase
      .from('project_teams')
      .select('*')
      .eq('project_id', projectId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getTeamMembers(teamId: string): Promise<ProjectTeamMember[]> {
    const { data, error } = await supabase
      .from('project_team_members')
      .select('id, team_id, user_id, role, added_at, added_by')
      .eq('team_id', teamId);
    
    if (error) throw error;
    
    // Fetch profiles using secure RPC (non-sensitive fields only)
    const userIds = (data || []).map(m => m.user_id);
    if (userIds.length === 0) return [];
    
    const { data: profiles } = await supabase
      .rpc('get_public_profiles', { _user_ids: userIds });
    
    const profileMap = new Map((profiles || []).map(p => [p.id, {
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      email: null as string | null, // Email not exposed via public API for security
    }]));
    
    return (data || []).map(m => ({
      ...m,
      role: m.role as 'lead' | 'member',
      profile: profileMap.get(m.user_id) || undefined,
    }));
  },

  async createTeam(
    projectId: string,
    name: string,
    description: string | undefined,
    userId: string
  ): Promise<ProjectTeam> {
    const { data, error } = await supabase
      .from('project_teams')
      .insert({
        project_id: projectId,
        name,
        description,
        created_by: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTeam(
    teamId: string,
    updates: { name?: string; description?: string }
  ): Promise<ProjectTeam> {
    const { data, error } = await supabase
      .from('project_teams')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTeam(teamId: string): Promise<void> {
    const { error } = await supabase
      .from('project_teams')
      .delete()
      .eq('id', teamId);
    
    if (error) throw error;
  },

  async addTeamMember(
    teamId: string,
    userId: string,
    role: 'lead' | 'member',
    addedBy: string
  ): Promise<ProjectTeamMember> {
    const { data, error } = await supabase
      .from('project_team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        added_by: addedBy,
      })
      .select()
      .single();
    
    if (error) throw error;
    return { ...data, role: data.role as 'lead' | 'member' };
  },

  async updateMemberRole(memberId: string, role: 'lead' | 'member'): Promise<void> {
    const { error } = await supabase
      .from('project_team_members')
      .update({ role })
      .eq('id', memberId);
    
    if (error) throw error;
  },

  async removeTeamMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('project_team_members')
      .delete()
      .eq('id', memberId);
    
    if (error) throw error;
  },

  async getAllProjectMembers(projectId: string): Promise<{ id: string; display_name: string; avatar_url: string | null; email: string | null }[]> {
    // Get all unique members from all teams in the project
    const { data: teams } = await supabase
      .from('project_teams')
      .select('id')
      .eq('project_id', projectId);
    
    if (!teams || teams.length === 0) {
      // Fallback: get active profiles using secure RPC (non-sensitive fields only)
      const { data: profiles } = await supabase
        .rpc('search_public_profiles', { _search_term: null, _limit: 50 });
      
      return (profiles || []).map(p => ({
        id: p.id,
        display_name: p.display_name || 'Unknown',
        avatar_url: p.avatar_url,
        email: null, // Email not exposed via public API
      }));
    }
    
    const teamIds = teams.map(t => t.id);
    
    const { data: members } = await supabase
      .from('project_team_members')
      .select('user_id')
      .in('team_id', teamIds);
    
    const userIds = [...new Set((members || []).map(m => m.user_id))];
    
    if (userIds.length === 0) {
      // Fallback: get active profiles using secure RPC
      const { data: profiles } = await supabase
        .rpc('search_public_profiles', { _search_term: null, _limit: 50 });
      
      return (profiles || []).map(p => ({
        id: p.id,
        display_name: p.display_name || 'Unknown',
        avatar_url: p.avatar_url,
        email: null, // Email not exposed via public API
      }));
    }
    
    // Fetch profiles using secure RPC
    const { data: profiles } = await supabase
      .rpc('get_public_profiles', { _user_ids: userIds });
    
    return (profiles || []).map(p => ({
      id: p.id,
      display_name: p.display_name || 'Unknown',
      avatar_url: p.avatar_url,
      email: null, // Email not exposed via public API
    }));
  },
};
