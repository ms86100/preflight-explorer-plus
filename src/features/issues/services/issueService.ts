/**
 * @fileoverview Issue service for database operations.
 * @module features/issues/services/issueService
 * 
 * @description
 * Provides all database operations for issues including CRUD operations,
 * pagination, filtering, and reference data management.
 * All operations respect Row-Level Security (RLS) policies.
 * 
 * @example
 * ```typescript
 * // Fetch paginated issues
 * const result = await issueService.getByProjectPaginated('project-id', { page: 1, pageSize: 20 });
 * 
 * // Create a new issue
 * const issue = await issueService.create({ summary: 'New task', ... }, userId);
 * ```
 */

import { supabase } from '@/integrations/supabase/client';
import type { ClassificationLevel } from '@/types/jira';
import {
  type PaginationParams,
  type PaginatedResult,
  getPaginationRange,
  buildPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/pagination';

/**
 * Data required to create a new issue.
 * 
 * @interface IssueInsert
 * @property {string} project_id - UUID of the parent project
 * @property {string} summary - Issue title (required)
 * @property {string} [description] - Detailed description (markdown supported)
 * @property {string} issue_type_id - UUID of the issue type
 * @property {string} status_id - UUID of the initial status
 * @property {string} [priority_id] - UUID of the priority level
 * @property {string} [assignee_id] - UUID of the assigned user
 * @property {string} [parent_id] - UUID of parent issue (for subtasks)
 * @property {string} [epic_id] - UUID of the epic this issue belongs to
 * @property {string} [due_date] - ISO date string for due date
 * @property {number} [story_points] - Agile story points estimate
 * @property {ClassificationLevel} [classification] - Security classification level
 */
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

/**
 * Raw issue data from the database.
 * 
 * @interface IssueRow
 */
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

/**
 * Issue data with related entities populated.
 * 
 * @interface IssueWithRelations
 * @extends IssueRow
 */
export interface IssueWithRelations extends IssueRow {
  /** Populated issue type data */
  issue_type: { id: string; name: string; color: string; category: string } | null;
  /** Populated status data */
  status: { id: string; name: string; color: string; category: string } | null;
  /** Populated priority data */
  priority: { id: string; name: string; color: string } | null;
  /** Populated reporter user data */
  reporter: { id: string; display_name: string; avatar_url: string | null } | null;
  /** Populated assignee user data */
  assignee: { id: string; display_name: string; avatar_url: string | null } | null;
  /** Populated epic data (if linked) */
  epic: { id: string; issue_key: string; summary: string } | null;
}

/**
 * Filter options for querying issues.
 * 
 * @interface IssueFilters
 * @property {string} [statusId] - Filter by status UUID
 * @property {string} [priorityId] - Filter by priority UUID
 * @property {string} [assigneeId] - Filter by assignee UUID
 * @property {string} [issueTypeId] - Filter by issue type UUID
 * @property {string} [search] - Search in summary (case-insensitive)
 */
export interface IssueFilters {
  statusId?: string;
  priorityId?: string;
  assigneeId?: string;
  issueTypeId?: string;
  search?: string;
}

/**
 * Issue service providing all database operations for issues.
 * 
 * @namespace issueService
 * 
 * @example
 * ```typescript
 * import { issueService } from '@/features/issues/services/issueService';
 * 
 * // Get issues with pagination
 * const { data, totalCount, hasNextPage } = await issueService.getByProjectPaginated(
 *   projectId,
 *   { page: 1, pageSize: 25 },
 *   { statusId: 'active-status-id' }
 * );
 * ```
 */
export const issueService = {
  /**
   * Fetches issues for a project with pagination and optional filters.
   * 
   * @param projectId - UUID of the project
   * @param pagination - Pagination parameters (page, pageSize)
   * @param filters - Optional filter criteria
   * @returns Paginated result with issues and metadata
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const result = await issueService.getByProjectPaginated(
   *   'project-uuid',
   *   { page: 1, pageSize: 20 },
   *   { search: 'bug', priorityId: 'high-priority-id' }
   * );
   * console.log(`Found ${result.totalCount} issues, showing page ${result.page}`);
   * ```
   */
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

    // Fetch profiles using secure RPC (non-sensitive fields only)
    const userIds = [...new Set(issues?.flatMap(i => [i.reporter_id, i.assignee_id].filter(Boolean)) || [])] as string[];
    const { data: profiles } = await supabase
      .rpc('get_public_profiles', { _user_ids: userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'] });

    // Map to expected shape (id, display_name, avatar_url)
    const profileMap = new Map(profiles?.map(p => [p.id, {
      id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
    }]) || []);

    const issuesWithRelations = (issues || []).map(issue => ({
      ...issue,
      reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) || null : null,
      assignee: issue.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
      epic: null,
    })) as IssueWithRelations[];

    return buildPaginatedResult(issuesWithRelations, count || 0, page, pageSize);
  },

  /**
   * Fetches issues for a project without pagination (limited to 100).
   * Kept for backward compatibility with existing code.
   * 
   * @param projectId - UUID of the project
   * @returns Array of issues with relations
   * @deprecated Use getByProjectPaginated for new code
   */
  async getByProject(projectId: string): Promise<IssueWithRelations[]> {
    const result = await this.getByProjectPaginated(projectId, { page: 1, pageSize: 100 });
    return result.data;
  },

  /**
   * Fetches a single issue by its human-readable key.
   * 
   * @param issueKey - Issue key in format "PROJECT-NUMBER" (e.g., "PROJ-123")
   * @returns The issue with relations, or null if not found
   * @throws {Error} If database query fails
   */
  async getByKey(issueKey: string): Promise<IssueWithRelations | null> {
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
    
    // Fetch user data from user_directory
    const userIds = [issue.reporter_id, issue.assignee_id].filter(Boolean);
    const { data: profiles } = await supabase
      .from('user_directory')
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

  /**
   * Fetches a single issue by its UUID.
   * 
   * @param id - UUID of the issue
   * @returns The issue with relations, or null if not found
   * @throws {Error} If database query fails
   */
  async getById(id: string): Promise<IssueWithRelations | null> {
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
    
    // Fetch user data from user_directory
    const userIds = [issue.reporter_id, issue.assignee_id].filter(Boolean);
    const { data: profiles } = await supabase
      .from('user_directory')
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

  /**
   * Creates a new issue in the database.
   * The issue_key and issue_number are auto-generated by a database trigger.
   * 
   * @param issue - Issue data to create
   * @param reporterId - UUID of the user creating the issue
   * @returns The created issue row
   * @throws {Error} If database insert fails
   * 
   * @example
   * ```typescript
   * const newIssue = await issueService.create({
   *   project_id: 'project-uuid',
   *   summary: 'Fix login bug',
   *   description: 'Users cannot login with special characters',
   *   issue_type_id: 'bug-type-id',
   *   status_id: 'todo-status-id',
   *   priority_id: 'high-priority-id'
   * }, currentUserId);
   * ```
   */
  async create(issue: IssueInsert, reporterId: string): Promise<IssueRow> {
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

  /**
   * Updates an existing issue.
   * 
   * @param id - UUID of the issue to update
   * @param updates - Partial issue data to update
   * @returns The updated issue row
   * @throws {Error} If database update fails
   */
  async update(id: string, updates: Partial<IssueInsert>): Promise<IssueRow> {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as IssueRow;
  },

  /**
   * Updates only the status of an issue.
   * Optimized for board drag-and-drop operations.
   * 
   * @param id - UUID of the issue
   * @param statusId - UUID of the new status
   * @returns The updated issue row
   * @throws {Error} If database update fails
   */
  async updateStatus(id: string, statusId: string): Promise<IssueRow> {
    const { data, error } = await supabase
      .from('issues')
      .update({ status_id: statusId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as IssueRow;
  },

  /**
   * Permanently deletes an issue.
   * 
   * @param id - UUID of the issue to delete
   * @throws {Error} If database delete fails
   * 
   * @remarks
   * This operation is irreversible. Consider implementing soft delete
   * for production use if data recovery is important.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('issues').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================================================
// Reference Data Services
// ============================================================================

/**
 * Service for fetching and managing reference data (issue types, priorities, statuses).
 * Reference data is typically cached with long stale times as it rarely changes.
 * 
 * @namespace referenceDataService
 */
export const referenceDataService = {
  /**
   * Fetches all issue types ordered by position.
   * 
   * @returns Array of issue types
   * @throws {Error} If database query fails
   */
  async getIssueTypes() {
    const { data, error } = await supabase
      .from('issue_types')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },

  /**
   * Fetches all priority levels ordered by position.
   * Lower position indicates higher priority.
   * 
   * @returns Array of priorities
   * @throws {Error} If database query fails
   */
  async getPriorities() {
    const { data, error } = await supabase
      .from('priorities')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },

  /**
   * Fetches all issue statuses ordered by position.
   * 
   * @returns Array of statuses
   * @throws {Error} If database query fails
   */
  async getStatuses() {
    const { data, error } = await supabase
      .from('issue_statuses')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },

  /**
   * Creates a new issue status.
   * Position is automatically set to the next available value.
   * 
   * @param status - Status data to create
   * @returns The created status
   * @throws {Error} If database insert fails
   * 
   * @example
   * ```typescript
   * const newStatus = await referenceDataService.createStatus({
   *   name: 'Code Review',
   *   category: 'in_progress',
   *   color: '#9333ea',
   *   description: 'Issue is being reviewed'
   * });
   * ```
   */
  async createStatus(status: {
    name: string;
    category: 'todo' | 'in_progress' | 'done';
    color?: string;
    description?: string;
  }) {
    // Get the next position
    const { data: existing } = await supabase
      .from('issue_statuses')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);
    
    const nextPosition = (existing?.[0]?.position ?? 0) + 1;
    
    const { data, error } = await supabase
      .from('issue_statuses')
      .insert({
        name: status.name,
        category: status.category,
        color: status.color || '#6B7280',
        description: status.description || null,
        position: nextPosition,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Fetches all resolution types ordered by position.
   * 
   * @returns Array of resolutions
   * @throws {Error} If database query fails
   */
  async getResolutions() {
    const { data, error } = await supabase
      .from('resolutions')
      .select('*')
      .order('position');
    if (error) throw error;
    return data;
  },
};
