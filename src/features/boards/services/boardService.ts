/**
 * @fileoverview Board and Sprint service for managing Kanban/Scrum boards.
 * @module features/boards/services/boardService
 * 
 * @description
 * Provides CRUD operations for boards, board columns, and sprints.
 * Supports both Kanban and Scrum board types with column status mappings.
 * 
 * @example
 * ```typescript
 * import { boardService, sprintService } from '@/features/boards/services/boardService';
 * 
 * // Get boards for a project
 * const boards = await boardService.getByProject('project-id');
 * 
 * // Manage sprints
 * const sprint = await sprintService.create({ board_id: 'board-id', name: 'Sprint 1' });
 * await sprintService.start(sprint.id, '2024-01-01', '2024-01-14');
 * ```
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Board database row structure.
 * 
 * @interface BoardRow
 * @property {string} id - Unique board identifier
 * @property {string} name - Board display name
 * @property {string} project_id - Associated project ID
 * @property {string} board_type - Type of board (kanban, scrum, basic)
 * @property {string | null} filter_jql - Optional JQL filter for issue visibility
 * @property {boolean} is_private - Whether board is private to owner
 * @property {string | null} owner_id - Board owner user ID
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface BoardRow {
  id: string;
  name: string;
  project_id: string;
  board_type: string;
  filter_jql: string | null;
  is_private: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Sprint database row structure.
 * 
 * @interface SprintRow
 * @property {string} id - Unique sprint identifier
 * @property {string} board_id - Associated board ID
 * @property {string} name - Sprint name
 * @property {string | null} goal - Sprint goal description
 * @property {string} state - Sprint state (future, active, closed)
 * @property {string | null} start_date - Sprint start date
 * @property {string | null} end_date - Sprint end date
 * @property {string | null} completed_date - Date sprint was completed
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface SprintRow {
  id: string;
  board_id: string;
  name: string;
  goal: string | null;
  state: string;
  start_date: string | null;
  end_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Board column database row structure.
 * 
 * @interface BoardColumnRow
 * @property {string} id - Unique column identifier
 * @property {string} board_id - Associated board ID
 * @property {string} name - Column display name
 * @property {number} position - Column order position
 * @property {number | null} min_issues - Minimum WIP limit
 * @property {number | null} max_issues - Maximum WIP limit
 * @property {string} created_at - ISO timestamp of creation
 */
export interface BoardColumnRow {
  id: string;
  board_id: string;
  name: string;
  position: number;
  min_issues: number | null;
  max_issues: number | null;
  created_at: string;
}

/**
 * Board service for managing board entities.
 * 
 * Provides operations for fetching boards and managing board columns
 * with their associated status mappings.
 */
export const boardService = {
  /**
   * Fetches all boards for a project.
   * 
   * @param projectId - The project ID to fetch boards for
   * @returns Array of boards ordered by creation date
   * @throws {Error} If the database query fails
   * 
   * @example
   * ```typescript
   * const boards = await boardService.getByProject('project-123');
   * console.log(`Found ${boards.length} boards`);
   * ```
   */
  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) throw error;
    return data as BoardRow[];
  },

  /**
   * Fetches a single board by ID.
   * 
   * @param id - The board ID to fetch
   * @returns The board data
   * @throws {Error} If the board is not found or query fails
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as BoardRow;
  },

  /**
   * Fetches columns for a board with their status mappings.
   * 
   * @param boardId - The board ID to fetch columns for
   * @returns Array of columns with nested status information
   * @throws {Error} If the database query fails
   * 
   * @example
   * ```typescript
   * const columns = await boardService.getColumns('board-123');
   * columns.forEach(col => {
   *   console.log(`${col.name}: ${col.column_statuses.length} statuses`);
   * });
   * ```
   */
  async getColumns(boardId: string) {
    const { data, error } = await supabase
      .from('board_columns')
      .select(`
        *,
        column_statuses:board_column_statuses(
          status:issue_statuses(id, name, color, category)
        )
      `)
      .eq('board_id', boardId)
      .order('position');

    if (error) throw error;
    return data;
  },

  /**
   * Creates default columns for a new board.
   * 
   * Sets up To Do, In Progress, and Done columns with appropriate
   * status mappings based on status categories.
   * 
   * @param boardId - The board ID to create columns for
   * 
   * @example
   * ```typescript
   * // After creating a new board
   * await boardService.createDefaultColumns(newBoard.id);
   * ```
   */
  /**
   * Creates default columns for a board based on project template.
   * 
   * @param boardId - The board ID to create columns for
   * @param template - The project template ('scrum', 'kanban', 'basic')
   * 
   * Template-specific column configurations:
   * - Scrum: To Do, In Progress (WIP 5), Done - Sprint-focused workflow
   * - Kanban: Backlog, Selected, In Progress (WIP 5), Review (WIP 3), Done - Flow-based with WIP limits
   * - Basic: To Do, In Progress, Done - Simple task tracking
   */
  async createDefaultColumns(boardId: string, template: 'scrum' | 'kanban' | 'basic' = 'scrum') {
    // Get all statuses
    const { data: statuses } = await supabase
      .from('issue_statuses')
      .select('id, name, category')
      .order('position');

    if (!statuses) return;

    // Group by category for column setup
    const todoStatuses = statuses.filter(s => s.category === 'todo');
    const inProgressStatuses = statuses.filter(s => s.category === 'in_progress');
    const doneStatuses = statuses.filter(s => s.category === 'done');

    // Template-specific column configurations (like Jira Data Center)
    let columns: Array<{
      name: string;
      position: number;
      statuses: typeof todoStatuses;
      max_issues?: number;
      min_issues?: number;
    }>;

    switch (template) {
      case 'kanban':
        // Kanban: Flow-based workflow with WIP limits and more stages
        columns = [
          { name: 'Backlog', position: 0, statuses: todoStatuses },
          { name: 'Selected for Development', position: 1, statuses: todoStatuses, max_issues: 10 },
          { name: 'In Progress', position: 2, statuses: inProgressStatuses, max_issues: 5 },
          { name: 'In Review', position: 3, statuses: inProgressStatuses, max_issues: 3 },
          { name: 'Done', position: 4, statuses: doneStatuses },
        ];
        break;
      
      case 'basic':
        // Basic: Simple 3-column workflow without WIP limits
        columns = [
          { name: 'To Do', position: 0, statuses: todoStatuses },
          { name: 'In Progress', position: 1, statuses: inProgressStatuses },
          { name: 'Done', position: 2, statuses: doneStatuses },
        ];
        break;
      
      case 'scrum':
      default:
        // Scrum: Sprint-focused workflow with WIP limits on in-progress
        columns = [
          { name: 'To Do', position: 0, statuses: todoStatuses },
          { name: 'In Progress', position: 1, statuses: inProgressStatuses, max_issues: 5 },
          { name: 'Done', position: 2, statuses: doneStatuses },
        ];
        break;
    }

    for (const col of columns) {
      const { data: column } = await supabase
        .from('board_columns')
        .insert({
          board_id: boardId,
          name: col.name,
          position: col.position,
          max_issues: col.max_issues,
          min_issues: col.min_issues,
        })
        .select()
        .single();

      if (column && col.statuses) {
        await supabase.from('board_column_statuses').insert(
          col.statuses.map(s => ({
            column_id: column.id,
            status_id: s.id,
          }))
        );
      }
    }
  },
};

/**
 * Sprint service for managing sprint entities.
 * 
 * Provides full lifecycle management for sprints including creation,
 * starting, completing, and issue assignment.
 */
export const sprintService = {
  /**
   * Fetches all sprints for a board.
   * 
   * @param boardId - The board ID to fetch sprints for
   * @returns Array of sprints ordered by creation date (newest first)
   * @throws {Error} If the database query fails
   */
  async getByBoard(boardId: string) {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SprintRow[];
  },

  /**
   * Gets the active sprint for a board.
   * 
   * @param boardId - The board ID to find active sprint for
   * @returns The active sprint or null if none
   * @throws {Error} If the database query fails
   */
  async getActive(boardId: string) {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('board_id', boardId)
      .eq('state', 'active')
      .maybeSingle();

    if (error) throw error;
    return data as SprintRow | null;
  },

  /**
   * Creates a new sprint.
   * 
   * @param sprint - Sprint creation data
   * @param sprint.board_id - The board ID for the sprint
   * @param sprint.name - Sprint name
   * @param sprint.goal - Optional sprint goal
   * @param sprint.start_date - Optional planned start date
   * @param sprint.end_date - Optional planned end date
   * @returns The created sprint
   * @throws {Error} If creation fails
   */
  async create(sprint: { board_id: string; name: string; goal?: string; start_date?: string; end_date?: string }) {
    const { data, error } = await supabase
      .from('sprints')
      .insert(sprint)
      .select()
      .single();

    if (error) throw error;
    return data as SprintRow;
  },

  /**
   * Starts a sprint with specified dates.
   * 
   * @param id - Sprint ID to start
   * @param startDate - Sprint start date (ISO string)
   * @param endDate - Sprint end date (ISO string)
   * @returns The updated sprint
   * @throws {Error} If update fails
   */
  async start(id: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('sprints')
      .update({ state: 'active', start_date: startDate, end_date: endDate })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SprintRow;
  },

  /**
   * Completes a sprint.
   * 
   * @param id - Sprint ID to complete
   * @returns The updated sprint
   * @throws {Error} If update fails
   */
  async complete(id: string) {
    const { data, error } = await supabase
      .from('sprints')
      .update({ state: 'closed', completed_date: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SprintRow;
  },

  /**
   * Updates sprint details.
   * 
   * @param id - Sprint ID to update
   * @param updates - Fields to update
   * @returns The updated sprint
   * @throws {Error} If update fails
   */
  async update(id: string, updates: { name?: string; goal?: string; start_date?: string; end_date?: string }) {
    const { data, error } = await supabase
      .from('sprints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SprintRow;
  },

  /**
   * Deletes a sprint and removes all issue associations.
   * 
   * @param id - Sprint ID to delete
   * @throws {Error} If deletion fails
   */
  async delete(id: string) {
    // First remove all issues from the sprint
    await supabase
      .from('sprint_issues')
      .delete()
      .eq('sprint_id', id);

    const { error } = await supabase
      .from('sprints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Moves all issues from a sprint back to the backlog.
   * 
   * @param sprintId - Sprint ID to remove issues from
   * @throws {Error} If operation fails
   */
  async moveAllIssuesToBacklog(sprintId: string) {
    const { error } = await supabase
      .from('sprint_issues')
      .delete()
      .eq('sprint_id', sprintId);

    if (error) throw error;
  },

  /**
   * Adds an issue to a sprint.
   * 
   * @param sprintId - Sprint ID to add issue to
   * @param issueId - Issue ID to add
   * @throws {Error} If operation fails
   */
  async addIssue(sprintId: string, issueId: string) {
    const { error } = await supabase
      .from('sprint_issues')
      .insert({ sprint_id: sprintId, issue_id: issueId });

    if (error) throw error;
  },

  /**
   * Removes an issue from a sprint.
   * 
   * @param sprintId - Sprint ID to remove issue from
   * @param issueId - Issue ID to remove
   * @throws {Error} If operation fails
   */
  async removeIssue(sprintId: string, issueId: string) {
    const { error } = await supabase
      .from('sprint_issues')
      .delete()
      .eq('sprint_id', sprintId)
      .eq('issue_id', issueId);

    if (error) throw error;
  },

  /**
   * Gets all issues in a sprint with full details.
   * 
   * @param sprintId - Sprint ID to fetch issues for
   * @returns Array of issues with type, status, priority, and assignee info
   * @throws {Error} If query fails
   */
  async getIssues(sprintId: string) {
    if (!sprintId) return [];
    
    const { data, error } = await supabase
      .from('sprint_issues')
      .select(`
        issue:issues(
          id, issue_key, summary, story_points, classification, status_id, assignee_id,
          issue_type:issue_types(id, name, color, category),
          status:issue_statuses(id, name, color, category),
          priority:priorities(id, name, color)
        )
      `)
      .eq('sprint_id', sprintId);

    if (error) throw error;
    
    const issues = data?.map(d => d.issue).filter(Boolean) || [];
    
    // Fetch profiles using secure RPC (non-sensitive fields only)
    const assigneeIds = [...new Set(issues.map(i => i?.assignee_id).filter(Boolean))] as string[];
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .rpc('get_public_profiles', { _user_ids: assigneeIds });
      
      // Map to expected shape (id, display_name, avatar_url)
      const profileMap = new Map(profiles?.map(p => [p.id, {
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }]) || []);
      return issues.map(issue => ({
        ...issue,
        assignee: issue?.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
      }));
    }
    
    return issues.map(issue => ({ ...issue, assignee: null }));
  },
};
