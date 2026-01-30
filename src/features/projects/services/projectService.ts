/**
 * @fileoverview Project service for database operations.
 * @module features/projects/services/projectService
 * 
 * @description
 * Provides all database operations for projects including CRUD operations,
 * pagination, filtering, and automatic board creation.
 * All operations respect Row-Level Security (RLS) policies.
 */

import { supabase } from '@/integrations/supabase/client';
import { boardService } from '@/features/boards/services/boardService';
import type { ClassificationLevel, ProjectTemplate, ProjectType } from '@/types/jira';
import {
  type PaginationParams,
  type PaginatedResult,
  getPaginationRange,
  buildPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/pagination';

// Type bypass for tables not yet in generated types
const db = supabase as any;

/**
 * Data required to create a new project.
 */
export interface ProjectInsert {
  key: string;
  name: string;
  description?: string;
  project_type?: ProjectType;
  lead_id?: string;
  workflow_scheme_id?: string;
}

/**
 * Raw project data from the database.
 */
export interface ProjectRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  project_type: string;
  category: string | null;
  lead_id: string | null;
  avatar_url: string | null;
  url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/**
 * Filter options for querying projects.
 */
export interface ProjectFilters {
  search?: string;
  projectType?: ProjectType;
}

/**
 * Project service providing all database operations for projects.
 */
export const projectService = {
  /**
   * Fetches projects with pagination and optional filters.
   */
  async getAllPaginated(
    pagination: PaginationParams = {},
    filters: ProjectFilters = {}
  ): Promise<PaginatedResult<ProjectRow>> {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = pagination;
    const { from, to } = getPaginationRange(page, pageSize);

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('is_archived', false);

    // Apply filters
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters.projectType) query = query.eq('project_type', filters.projectType);

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return buildPaginatedResult((data || []) as unknown as ProjectRow[], count || 0, page, pageSize);
  },

  /**
   * Fetches all projects without pagination (limited to 100).
   */
  async getAll(): Promise<ProjectRow[]> {
    const result = await projectService.getAllPaginated({ page: 1, pageSize: 100 });
    return result.data;
  },

  /**
   * Fetches a single project by its key (e.g., "PROJ").
   */
  async getByKey(key: string): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data as unknown as ProjectRow;
  },

  /**
   * Fetches a single project by its UUID.
   */
  async getById(id: string): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as ProjectRow;
  },

  /**
   * Creates a new project with automatic board creation.
   */
  async create(project: ProjectInsert, userId: string): Promise<ProjectRow> {
    // First create the project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        key: project.key,
        name: project.name,
        description: project.description,
        project_type: project.project_type || 'software',
        lead_id: userId,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add creator as project admin (using db for untyped tables)
    const { data: adminRole } = await db
      .from('project_roles')
      .select('id')
      .eq('name', 'Administrators')
      .single();

    if (adminRole) {
      await db.from('project_role_actors').insert({
        project_id: projectData.id,
        role_id: adminRole.id,
        user_id: userId,
      });
    }

    // Create default board
    const { data: boardData } = await supabase.from('boards').insert({
      name: `${project.name} Board`,
      project_id: projectData.id,
      board_type: 'scrum',
      owner_id: userId,
    }).select().single();

    // Assign workflow scheme to project
    let schemeId = project.workflow_scheme_id;
    
    if (!schemeId) {
      const { data: defaultScheme } = await supabase
        .from('workflow_schemes')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();
      schemeId = defaultScheme?.id;
    }

    if (schemeId) {
      const { data: existingScheme } = await supabase
        .from('project_workflow_schemes')
        .select('id')
        .eq('project_id', projectData.id)
        .maybeSingle();

      if (!existingScheme) {
        await supabase.from('project_workflow_schemes').insert({
          project_id: projectData.id,
          scheme_id: schemeId,
        });
      }
    }

    // Generate board columns from the assigned workflow
    if (boardData) {
      try {
        await boardService.generateColumnsFromWorkflow(boardData.id, projectData.id);
      } catch {
        await boardService.createDefaultColumns(boardData.id, 'scrum');
      }
    }

    return projectData as unknown as ProjectRow;
  },

  /**
   * Updates an existing project.
   */
  async update(id: string, updates: Partial<ProjectInsert>): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ProjectRow;
  },

  /**
   * Archives a project (soft delete).
   */
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Permanently deletes a project and all associated data.
   */
  async deleteProject(id: string): Promise<void> {
    // Get boards for this project
    const { data: boards } = await supabase
      .from('boards')
      .select('id')
      .eq('project_id', id);

    const boardIds = boards?.map(b => b.id) || [];

    // Get sprints for these boards
    if (boardIds.length > 0) {
      const { data: sprints } = await supabase
        .from('sprints')
        .select('id')
        .in('board_id', boardIds);

      const sprintIds = sprints?.map(s => s.id) || [];

      // Delete sprint issues
      if (sprintIds.length > 0) {
        await supabase.from('sprint_issues').delete().in('sprint_id', sprintIds);
        // sprint_history might not exist in schema
        await db.from('sprint_history').delete().in('sprint_id', sprintIds);
      }

      // Delete sprints
      await supabase.from('sprints').delete().in('board_id', boardIds);

      // Get columns for these boards
      const { data: columns } = await supabase
        .from('board_columns')
        .select('id')
        .in('board_id', boardIds);

      const columnIds = columns?.map(c => c.id) || [];

      // Delete column statuses
      if (columnIds.length > 0) {
        await supabase.from('board_column_statuses').delete().in('column_id', columnIds);
      }

      // Delete columns
      await supabase.from('board_columns').delete().in('board_id', boardIds);
    }

    // Delete boards
    await supabase.from('boards').delete().eq('project_id', id);

    // Get issues for this project
    const { data: issues } = await supabase
      .from('issues')
      .select('id')
      .eq('project_id', id);

    const issueIds = issues?.map(i => i.id) || [];

    if (issueIds.length > 0) {
      // Delete issue-related data
      await supabase.from('attachments').delete().in('issue_id', issueIds);
      await supabase.from('comments').delete().in('issue_id', issueIds);
      await supabase.from('issue_history').delete().in('issue_id', issueIds);
      // issue_labels might not exist in schema
      await db.from('issue_labels').delete().in('issue_id', issueIds);
      await supabase.from('issue_links').delete().in('source_issue_id', issueIds);
      await supabase.from('issue_links').delete().in('target_issue_id', issueIds);
      await supabase.from('custom_field_values').delete().in('issue_id', issueIds);
      
      // Clear epic references before deleting
      await supabase.from('issues').update({ epic_id: null }).in('epic_id', issueIds);
      await supabase.from('issues').update({ parent_id: null }).in('parent_id', issueIds);
    }

    // Delete issues
    await supabase.from('issues').delete().eq('project_id', id);

    // Delete components and labels
    await supabase.from('components').delete().eq('project_id', id);
    // labels table might not exist
    await db.from('labels').delete().eq('project_id', id);

    // Delete project role actors (untyped)
    await db.from('project_role_actors').delete().eq('project_id', id);

    // Delete project workflow schemes
    await supabase.from('project_workflow_schemes').delete().eq('project_id', id);

    // Delete git repositories linked to project
    await supabase.from('git_repositories').delete().eq('project_id', id);

    // Delete additional project-related data (some may not exist in schema)
    await supabase.from('automation_rules').delete().eq('project_id', id);
    await supabase.from('custom_field_contexts').delete().eq('project_id', id);
    await db.from('data_block_instances').delete().eq('project_id', id);
    await db.from('plugin_installations').delete().eq('project_id', id);
    await db.from('project_permission_schemes').delete().eq('project_id', id);
    await db.from('project_teams').delete().eq('project_id', id);
    await supabase.from('versions').delete().eq('project_id', id);
    // workflows table doesn't have project_id - skip
    
    // Finally, delete the project
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) throw error;
  },
};
