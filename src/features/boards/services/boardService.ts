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
    const { data, error } = await (supabase.from as any)('boards')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) throw error;
    return (data as unknown) as BoardRow[];
  },

  /**
   * Fetches a single board by ID.
   * 
   * @param id - The board ID to fetch
   * @returns The board data
   * @throws {Error} If the board is not found or query fails
   */
  async getById(id: string) {
    const { data, error } = await (supabase.from as any)('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return (data as unknown) as BoardRow;
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
    const { data, error } = await (supabase.from as any)('board_columns')
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
   * Creates a new board column and auto-maps a matching status if found.
   */
  async createColumn(boardId: string, name: string, position: number, maxIssues?: number) {
    const { data, error } = await (supabase.from as any)('board_columns')
      .insert({
        board_id: boardId,
        name,
        position,
        max_issues: maxIssues,
      })
      .select()
      .single();

    if (error) throw error;
    
    const column = (data as unknown) as BoardColumnRow;
    
    // Try to auto-map a status with matching name (case-insensitive)
    const { data: statuses } = await (supabase.from as any)('issue_statuses')
      .select('id, name')
      .order('position');
    
    if (statuses && statuses.length > 0) {
      const normalizedColumnName = name.toLowerCase().trim();
      const matchingStatus = (statuses as any[]).find(
        s => s.name.toLowerCase().trim() === normalizedColumnName
      );
      
      if (matchingStatus) {
        await (supabase.from as any)('board_column_statuses').insert({
          column_id: column.id,
          status_id: matchingStatus.id,
        });
      }
    }
    
    return column;
  },

  /**
   * Updates a board column.
   */
  async updateColumn(columnId: string, updates: { name?: string; position?: number; max_issues?: number | null; min_issues?: number | null }) {
    const { data, error } = await (supabase.from as any)('board_columns')
      .update(updates)
      .eq('id', columnId)
      .select()
      .single();

    if (error) throw error;
    return (data as unknown) as BoardColumnRow;
  },

  /**
   * Deletes a board column and its status mappings.
   */
  async deleteColumn(columnId: string) {
    // First delete status mappings
    await (supabase.from as any)('board_column_statuses')
      .delete()
      .eq('column_id', columnId);

    const { error } = await (supabase.from as any)('board_columns')
      .delete()
      .eq('id', columnId);

    if (error) throw error;
  },

  /**
   * Adds a status to a column.
   */
  async addStatusToColumn(columnId: string, statusId: string) {
    const { error } = await (supabase.from as any)('board_column_statuses')
      .insert({ column_id: columnId, status_id: statusId });

    if (error) throw error;
  },

  /**
   * Removes a status from a column.
   */
  async removeStatusFromColumn(columnId: string, statusId: string) {
    const { error } = await (supabase.from as any)('board_column_statuses')
      .delete()
      .eq('column_id', columnId)
      .eq('status_id', statusId);

    if (error) throw error;
  },

  /**
   * Gets all statuses (for mapping UI).
   */
  async getAllStatuses() {
    const { data, error } = await (supabase.from as any)('issue_statuses')
      .select('id, name, color, category')
      .order('position');

    if (error) throw error;
    return data;
  },

  /**
   * Reorders columns by updating their positions.
   */
  async reorderColumns(columns: { id: string; position: number }[]) {
    for (const col of columns) {
      await (supabase.from as any)('board_columns')
        .update({ position: col.position })
        .eq('id', col.id);
    }
  },

  /**
   * Creates default columns for a board based on project template.
   * @deprecated Use generateColumnsFromWorkflow instead for workflow-driven boards.
   */
  async createDefaultColumns(boardId: string, template: 'scrum' | 'kanban' | 'basic' = 'scrum') {
    // Get all statuses
    const { data: statuses } = await (supabase.from as any)('issue_statuses')
      .select('id, name, category')
      .order('position');

    if (!statuses) return;

    // Group by category for column setup
    const todoStatuses = (statuses as any[]).filter(s => s.category === 'todo');
    const inProgressStatuses = (statuses as any[]).filter(s => s.category === 'in_progress');
    const doneStatuses = (statuses as any[]).filter(s => s.category === 'done');

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
      const { data: column } = await (supabase.from as any)('board_columns')
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
        await (supabase.from as any)('board_column_statuses').insert(
          col.statuses.map(s => ({
            column_id: column.id,
            status_id: s.id,
          }))
        );
      }
    }
  },

  /**
   * Generates board columns from a project's assigned workflow.
   * Creates one column per unique status in the workflow and maps each status.
   * 
   * @param boardId - The board ID to generate columns for
   * @param projectId - The project ID to get the workflow from
   * @param preserveWipLimits - Whether to preserve existing WIP limits (default: true)
   * @returns Object with generated columns count
   */
  async generateColumnsFromWorkflow(
    boardId: string, 
    projectId: string,
    preserveWipLimits = true
  ): Promise<{ columnsCreated: number; columnsRemoved: number }> {
    // 1. Get the project's workflow scheme
    const { data: schemeData } = await (supabase.from as any)('project_workflow_schemes')
      .select('scheme_id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!schemeData?.scheme_id) {
      throw new Error('Project has no workflow scheme assigned');
    }

    // 2. Get workflow mappings for this scheme (try default first, then any)
    let { data: mappings } = await (supabase.from as any)('workflow_scheme_mappings')
      .select('workflow_id')
      .eq('scheme_id', schemeData.scheme_id)
      .is('issue_type_id', null) // Try default mapping first
      .maybeSingle();

    // If no default mapping, get any workflow from the scheme
    if (!mappings?.workflow_id) {
      const { data: anyMapping } = await (supabase.from as any)('workflow_scheme_mappings')
        .select('workflow_id')
        .eq('scheme_id', schemeData.scheme_id)
        .limit(1)
        .maybeSingle();
      mappings = anyMapping;
    }

    const workflowId = mappings?.workflow_id;
    if (!workflowId) {
      throw new Error('No workflow found in scheme');
    }

    // 3. Get workflow steps with status information
    const { data: steps } = await (supabase.from as any)('workflow_steps')
      .select(`
        id,
        status_id,
        position_x,
        status:issue_statuses(id, name, color, category)
      `)
      .eq('workflow_id', workflowId)
      .order('position_x');

    if (!steps || steps.length === 0) {
      throw new Error('Workflow has no steps defined');
    }

    // Build an ordered list of unique workflow statuses (in workflow order)
    const workflowStatuses = steps
      .map((s: any) => s.status as { id: string; name: string; color: string | null; category: string | null } | null)
      .filter(Boolean)
      .filter((s: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x?.id === s?.id) === idx) as {
        id: string;
        name: string;
        color: string | null;
        category: string | null;
      }[];

    // Also include statuses currently used by issues in the project so issues don't disappear after regeneration
    const { data: issueStatusRows, error: issueStatusError } = await (supabase.from as any)('issues')
      .select('status_id')
      .eq('project_id', projectId)
      .not('status_id', 'is', null);

    if (issueStatusError) throw issueStatusError;

    const workflowStatusIds = new Set(workflowStatuses.map((s) => s.id));
    const usedStatusIds = new Set<string>((issueStatusRows || []).map((r: any) => r.status_id).filter(Boolean));

    const extraStatusIds = Array.from(usedStatusIds).filter((id) => !workflowStatusIds.has(id));

    let extraStatuses: { id: string; name: string; color: string | null; category: string | null }[] = [];
    if (extraStatusIds.length > 0) {
      const { data: extra, error: extraError } = await (supabase.from as any)('issue_statuses')
        .select('id, name, color, category')
        .in('id', extraStatusIds)
        .order('position');

      if (extraError) throw extraError;
      extraStatuses = (extra || []) as any;
    }

    const statusesToCreate = [...workflowStatuses, ...extraStatuses];

    // 4. Get existing columns to preserve WIP limits
    const existingColumns = await this.getColumns(boardId);
    const existingWipLimits = new Map<string, { max: number | null; min: number | null }>();
    
    if (preserveWipLimits && existingColumns) {
      for (const col of existingColumns) {
        // Map by column name for matching
        existingWipLimits.set(col.name.toLowerCase(), {
          max: col.max_issues,
          min: col.min_issues,
        });
      }
    }

    // 5. Delete existing columns and their mappings
    if (existingColumns) {
      for (const col of existingColumns) {
        await (supabase.from as any)('board_column_statuses')
          .delete()
          .eq('column_id', col.id);
        
        await (supabase.from as any)('board_columns')
          .delete()
          .eq('id', col.id);
      }
    }

    // 6. Create new columns from workflow steps (one column per status)
    let position = 0;
    const createdStatusIds = new Set<string>();

    for (const status of statusesToCreate) {
      // Skip if we already created a column for this status
      if (createdStatusIds.has(status.id)) continue;
      createdStatusIds.add(status.id);

      const columnName = status.name;
      const wipLimits = existingWipLimits.get(columnName.toLowerCase());

      const { data: column } = await (supabase.from as any)('board_columns')
        .insert({
          board_id: boardId,
          name: columnName,
          position: position++,
          max_issues: wipLimits?.max ?? null,
          min_issues: wipLimits?.min ?? null,
        })
        .select()
        .single();

      if (column) {
        // Map the status to this column
        await (supabase.from as any)('board_column_statuses').insert({
          column_id: column.id,
          status_id: status.id,
        });
      }
    }

    return {
      columnsCreated: createdStatusIds.size,
      columnsRemoved: existingColumns?.length || 0,
    };
  },

  /**
   * Syncs board columns with the project's workflow.
   * Adds missing columns for new workflow steps and optionally removes orphaned columns.
   * 
   * @param boardId - The board ID to sync
   * @param projectId - The project ID to get the workflow from
   * @param removeOrphans - Whether to remove columns not in workflow (default: false)
   */
  async syncBoardColumnsWithWorkflow(
    boardId: string,
    projectId: string,
    removeOrphans = false
  ): Promise<{ added: number; removed: number }> {
    // Get the project's workflow scheme
    const { data: schemeData } = await (supabase.from as any)('project_workflow_schemes')
      .select('scheme_id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!schemeData?.scheme_id) {
      return { added: 0, removed: 0 };
    }

    // Get default workflow from scheme (or fallback to any)
    let { data: mappings } = await (supabase.from as any)('workflow_scheme_mappings')
      .select('workflow_id')
      .eq('scheme_id', schemeData.scheme_id)
      .is('issue_type_id', null)
      .maybeSingle();

    // Fallback to any workflow if no default
    if (!mappings?.workflow_id) {
      const { data: anyMapping } = await (supabase.from as any)('workflow_scheme_mappings')
        .select('workflow_id')
        .eq('scheme_id', schemeData.scheme_id)
        .limit(1)
        .maybeSingle();
      mappings = anyMapping;
    }

    if (!mappings?.workflow_id) {
      return { added: 0, removed: 0 };
    }

    // Get workflow steps
    const { data: steps } = await (supabase.from as any)('workflow_steps')
      .select(`
        id,
        status_id,
        position_x,
        status:issue_statuses(id, name, color, category)
      `)
      .eq('workflow_id', mappings.workflow_id)
      .order('position_x');

    if (!steps) {
      return { added: 0, removed: 0 };
    }

    // Get existing columns with their status mappings
    const existingColumns = await this.getColumns(boardId);
    const mappedStatusIds = new Set<string>();
    
    if (existingColumns) {
      for (const col of existingColumns) {
        const columnStatuses = (col.column_statuses || []) as Array<{ status: { id: string } | null }>;
        for (const cs of columnStatuses) {
          if (cs.status?.id) {
            mappedStatusIds.add(cs.status.id);
          }
        }
      }
    }

    // Get workflow status IDs
    const workflowStatusIds = new Set((steps as any[]).map((s: any) => s.status_id));

    // Add columns for statuses in workflow but not mapped
    let added = 0;
    const maxPosition = existingColumns?.length || 0;

    for (const step of steps as any[]) {
      if (!mappedStatusIds.has(step.status_id)) {
        const status = step.status as { id: string; name: string; color: string | null; category: string | null } | null;
        if (!status) continue;

        const { data: column } = await (supabase.from as any)('board_columns')
          .insert({
            board_id: boardId,
            name: status.name,
            position: maxPosition + added,
          })
          .select()
          .single();

        if (column) {
          await (supabase.from as any)('board_column_statuses').insert({
            column_id: column.id,
            status_id: status.id,
          });
          added++;
        }
      }
    }

    // Remove orphaned columns if requested
    let removed = 0;
    if (removeOrphans && existingColumns) {
      for (const col of existingColumns) {
        const columnStatuses = (col.column_statuses || []) as Array<{ status: { id: string } | null }>;
        const hasWorkflowStatus = columnStatuses.some(cs => 
          cs.status?.id && workflowStatusIds.has(cs.status.id)
        );

        if (!hasWorkflowStatus) {
          await (supabase.from as any)('board_column_statuses')
            .delete()
            .eq('column_id', col.id);
          
          await (supabase.from as any)('board_columns')
            .delete()
            .eq('id', col.id);
          
          removed++;
        }
      }
    }

    return { added, removed };
  },

  /**
   * Gets the workflow status IDs for a project.
   * Useful for validating if a status is part of the project's workflow.
   */
  async getProjectWorkflowStatusIds(projectId: string): Promise<Set<string>> {
    const { data: schemeData } = await (supabase.from as any)('project_workflow_schemes')
      .select('scheme_id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!schemeData?.scheme_id) {
      return new Set();
    }

    const { data: mappings } = await (supabase.from as any)('workflow_scheme_mappings')
      .select('workflow_id')
      .eq('scheme_id', schemeData.scheme_id)
      .is('issue_type_id', null)
      .maybeSingle();

    if (!mappings?.workflow_id) {
      return new Set();
    }

    const { data: steps } = await (supabase.from as any)('workflow_steps')
      .select('status_id')
      .eq('workflow_id', mappings.workflow_id);

    return new Set((steps as any[])?.map((s: any) => s.status_id) || []);
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
    const { data, error } = await (supabase.from as any)('sprints')
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
    const { data, error } = await (supabase.from as any)('sprints')
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
    const { data, error } = await (supabase.from as any)('sprints')
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
    const { data, error } = await (supabase.from as any)('sprints')
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
    const { data, error } = await (supabase.from as any)('sprints')
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
    const { data, error } = await (supabase.from as any)('sprints')
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
    await (supabase.from as any)('sprint_issues')
      .delete()
      .eq('sprint_id', id);

    const { error } = await (supabase.from as any)('sprints')
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
    const { error } = await (supabase.from as any)('sprint_issues')
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
    const { error } = await (supabase.from as any)('sprint_issues')
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
    const { error } = await (supabase.from as any)('sprint_issues')
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
    
    const { data, error } = await (supabase.from as any)('sprint_issues')
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
    
    const issues = (data as any[])?.map((d: any) => d.issue).filter(Boolean) || [];
    
    // Fetch profiles using secure RPC (non-sensitive fields only)
    const assigneeIds = [...new Set(issues.map((i: any) => i?.assignee_id).filter(Boolean))] as string[];
    if (assigneeIds.length > 0) {
      const { data: profiles } = await (supabase.rpc as any)('get_public_profiles', { _user_ids: assigneeIds });
      
      // Map to expected shape (id, display_name, avatar_url)
      const profileMap = new Map((profiles as any[])?.map((p: any) => [p.id, {
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }]) || []);
      return issues.map((issue: any) => ({
        ...issue,
        assignee: issue?.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
      }));
    }
    
    return issues.map((issue: any) => ({ ...issue, assignee: null }));
  },
};
