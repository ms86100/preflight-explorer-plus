import { supabase } from '@/integrations/supabase/client';
import type { ClassificationLevel } from '@/types/jira';
import {
  type PaginationParams,
  type PaginatedResult,
  getPaginationRange,
  buildPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/pagination';

export interface IssueInsert {
  project_id: string;
  summary: string;
  description?: string;
  issue_type_id: string;
  status_id: string;
  priority_id?: string;
  assignee_id?: string;
  parent_id?: string;
  epic_id?: string;
  due_date?: string;
  story_points?: number;
  classification?: ClassificationLevel;
}

export interface IssueRow {
  id: string;
  project_id: string;
  issue_key: string;
  issue_number: number;
  summary: string;
  description: string | null;
  issue_type_id: string;
  status_id: string;
  priority_id: string | null;
  resolution_id: string | null;
  reporter_id: string;
  assignee_id: string | null;
  parent_id: string | null;
  epic_id: string | null;
  due_date: string | null;
  original_estimate: number | null;
  remaining_estimate: number | null;
  time_spent: number | null;
  story_points: number | null;
  environment: string | null;
  lexorank: string | null;
  classification: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueWithRelations extends IssueRow {
  issue_type: { id: string; name: string; color: string; category: string } | null;
  status: { id: string; name: string; color: string; category: string } | null;
  priority: { id: string; name: string; color: string } | null;
  reporter: { id: string; display_name: string; avatar_url: string | null } | null;
  assignee: { id: string; display_name: string; avatar_url: string | null } | null;
  epic: { id: string; issue_key: string; summary: string } | null;
}

export interface IssueFilters {
  statusId?: string;
  priorityId?: string;
  assigneeId?: string;
  issueTypeId?: string;
  search?: string;
}

export const issueService = {
  // Paginated query for large datasets
  async getByProjectPaginated(
    projectId: string,
    pagination: PaginationParams = {},
    filters: IssueFilters = {}
  ): Promise<PaginatedResult<IssueWithRelations>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const { from, to } = getPaginationRange(page, pageSize);

    // Build query with filters
    let query = supabase
      .from('issues')
      .select(`
        id, issue_key, issue_number, summary, description, story_points, classification,
        status_id, priority_id, issue_type_id, assignee_id, reporter_id, project_id,
        due_date, original_estimate, remaining_estimate, time_spent, created_at, updated_at,
        issue_type:issue_types(id, name, color, category),
        status:issue_statuses(id, name, color, category),
        priority:priorities(id, name, color)
      `, { count: 'exact' })
      .eq('project_id', projectId);

    // Apply filters
    if (filters.statusId) query = query.eq('status_id', filters.statusId);
    if (filters.priorityId) query = query.eq('priority_id', filters.priorityId);
    if (filters.assigneeId) query = query.eq('assignee_id', filters.assigneeId);
    if (filters.issueTypeId) query = query.eq('issue_type_id', filters.issueTypeId);
    if (filters.search) query = query.ilike('summary', `%${filters.search}%`);

    const { data: issues, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Fetch profiles for reporter and assignee
    const userIds = [...new Set(issues?.flatMap(i => [i.reporter_id, i.assignee_id].filter(Boolean)) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const issuesWithRelations = (issues || []).map(issue => ({
      ...issue,
      reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) || null : null,
      assignee: issue.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
      epic: null,
    })) as IssueWithRelations[];

    return buildPaginatedResult(issuesWithRelations, count || 0, page, pageSize);
  },

  // Keep non-paginated for backward compatibility (limited to 100)
  async getByProject(projectId: string) {
    const result = await this.getByProjectPaginated(projectId, { page: 1, pageSize: 100 });
    return result.data;
  },

  async getByKey(issueKey: string) {
    const { data: issue, error } = await supabase
      .from('issues')
      .select(`
        id, issue_key, issue_number, summary, description, story_points, classification,
        status_id, priority_id, issue_type_id, assignee_id, reporter_id, project_id,
        due_date, original_estimate, remaining_estimate, time_spent, created_at, updated_at,
        issue_type:issue_types(id, name, color, category),
        status:issue_statuses(id, name, color, category),
        priority:priorities(id, name, color)
      `)
      .eq('issue_key', issueKey)
      .maybeSingle();

    if (error) throw error;
    if (!issue) return null as unknown as IssueWithRelations;
    
    // Fetch profiles
    const userIds = [issue.reporter_id, issue.assignee_id].filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    return {
      ...issue,
      reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) || null : null,
      assignee: issue.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
      epic: null,
    } as IssueWithRelations;
  },

  async getById(id: string) {
    const { data: issue, error } = await supabase
      .from('issues')
      .select(`
        id, issue_key, issue_number, summary, description, story_points, classification,
        status_id, priority_id, issue_type_id, assignee_id, reporter_id, project_id,
        due_date, original_estimate, remaining_estimate, time_spent, created_at, updated_at,
        issue_type:issue_types(id, name, color, category),
        status:issue_statuses(id, name, color, category),
        priority:priorities(id, name, color)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!issue) return null as unknown as IssueWithRelations;
    
    // Fetch profiles
    const userIds = [issue.reporter_id, issue.assignee_id].filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    return {
      ...issue,
      reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) || null : null,
      assignee: issue.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
      epic: null,
    } as IssueWithRelations;
  },

  async create(issue: IssueInsert, reporterId: string) {
    // Note: issue_key and issue_number are auto-generated by database trigger
    const insertData = {
      project_id: issue.project_id,
      summary: issue.summary,
      description: issue.description,
      issue_type_id: issue.issue_type_id,
      status_id: issue.status_id,
      priority_id: issue.priority_id,
      assignee_id: issue.assignee_id,
      parent_id: issue.parent_id,
      epic_id: issue.epic_id,
      due_date: issue.due_date,
      story_points: issue.story_points,
      classification: issue.classification || 'restricted',
      reporter_id: reporterId,
      issue_key: 'TEMP-0', // Will be replaced by trigger
      issue_number: 0, // Will be replaced by trigger
    };

    const { data, error } = await supabase
      .from('issues')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    return data as IssueRow;
  },

  async update(id: string, updates: Partial<IssueInsert>) {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as IssueRow;
  },

  async updateStatus(id: string, statusId: string) {
    const { data, error } = await supabase
      .from('issues')
      .update({ status_id: statusId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as IssueRow;
  },

  async delete(id: string) {
    const { error } = await supabase.from('issues').delete().eq('id', id);
    if (error) throw error;
  },
};

// Reference data services
export const referenceDataService = {
  async getIssueTypes() {
    const { data, error } = await supabase
      .from('issue_types')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },

  async getPriorities() {
    const { data, error } = await supabase
      .from('priorities')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },

  async getStatuses() {
    const { data, error } = await supabase
      .from('issue_statuses')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },

  async getResolutions() {
    const { data, error } = await supabase
      .from('resolutions')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },
};
