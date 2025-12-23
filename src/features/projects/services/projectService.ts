/**
 * @fileoverview Project service for database operations.
 * @module features/projects/services/projectService
 * 
 * @description
 * Provides all database operations for projects including CRUD operations,
 * pagination, filtering, and automatic board creation.
 * All operations respect Row-Level Security (RLS) policies.
 * 
 * @example
 * ```typescript
 * import { projectService } from '@/features/projects/services/projectService';
 * 
 * // Fetch all projects
 * const projects = await projectService.getAll();
 * 
 * // Create a new project
 * const project = await projectService.create({
 *   pkey: 'NEW',
 *   name: 'New Project'
 * }, userId);
 * ```
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

/**
 * Data required to create a new project.
 * 
 * @interface ProjectInsert
 * @property {string} pkey - Unique project key (2-10 uppercase letters)
 * @property {string} name - Human-readable project name
 * @property {string} [description] - Project description
 * @property {ProjectType} [project_type] - Type of project (default: 'software')
 * @property {ProjectTemplate} [template] - Methodology template (default: 'scrum')
 * @property {ClassificationLevel} [classification] - Security classification
 * @property {string} [program_id] - UUID of parent program
 * @property {string} [lead_id] - UUID of project lead
 */
export interface ProjectInsert {
  pkey: string;
  name: string;
  description?: string;
  project_type?: ProjectType;
  template?: ProjectTemplate;
  classification?: ClassificationLevel;
  program_id?: string;
  lead_id?: string;
}

/**
 * Raw project data from the database.
 * 
 * @interface ProjectRow
 */
export interface ProjectRow {
  id: string;
  pkey: string;
  name: string;
  description: string | null;
  project_type: string;
  template: string;
  category_id: string | null;
  lead_id: string | null;
  default_assignee_id: string | null;
  avatar_url: string | null;
  url: string | null;
  issue_counter: number;
  is_archived: boolean;
  classification: string;
  program_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Filter options for querying projects.
 * 
 * @interface ProjectFilters
 * @property {string} [search] - Search in project name (case-insensitive)
 * @property {ProjectType} [projectType] - Filter by project type
 * @property {ClassificationLevel} [classification] - Filter by classification level
 */
export interface ProjectFilters {
  search?: string;
  projectType?: ProjectType;
  classification?: ClassificationLevel;
}

/**
 * Project service providing all database operations for projects.
 * 
 * @namespace projectService
 * 
 * @example
 * ```typescript
 * import { projectService } from '@/features/projects/services/projectService';
 * 
 * // Get projects with pagination
 * const { data, totalCount } = await projectService.getAllPaginated(
 *   { page: 1, pageSize: 10 },
 *   { search: 'Mobile' }
 * );
 * ```
 */
export const projectService = {
  /**
   * Fetches projects with pagination and optional filters.
   * Only returns non-archived projects.
   * 
   * @param pagination - Pagination parameters (page, pageSize)
   * @param filters - Optional filter criteria
   * @returns Paginated result with projects and metadata
   * @throws {Error} If database query fails
   * 
   * @example
   * ```typescript
   * const result = await projectService.getAllPaginated(
   *   { page: 1, pageSize: 20 },
   *   { projectType: 'software', search: 'API' }
   * );
   * ```
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
    if (filters.classification) query = query.eq('classification', filters.classification);

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return buildPaginatedResult(data as ProjectRow[], count || 0, page, pageSize);
  },

  /**
   * Fetches all projects without pagination (limited to 100).
   * Kept for backward compatibility with existing code.
   * 
   * @returns Array of projects
   * @deprecated Use getAllPaginated for new code
   */
  async getAll(): Promise<ProjectRow[]> {
    const result = await projectService.getAllPaginated({ page: 1, pageSize: 100 });
    return result.data;
  },

  /**
   * Fetches a single project by its key (e.g., "PROJ").
   * 
   * @param pkey - The project key
   * @returns The project row
   * @throws {Error} If project not found or database query fails
   */
  async getByKey(pkey: string): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('pkey', pkey)
      .single();

    if (error) throw error;
    return data as ProjectRow;
  },

  /**
   * Fetches a single project by its UUID.
   * 
   * @param id - UUID of the project
   * @returns The project row
   * @throws {Error} If project not found or database query fails
   */
  async getById(id: string): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ProjectRow;
  },

  /**
   * Creates a new project with automatic board creation.
   * 
   * @param project - Project data to create
   * @param userId - UUID of the user creating the project
   * @returns The created project row
   * @throws {Error} If database operations fail
   * 
   * @remarks
   * This method performs several operations:
   * 1. Creates the project record
   * 2. Adds the creator as a project administrator
   * 3. Creates a default board based on the project template
   * 
   * @example
   * ```typescript
   * const project = await projectService.create({
   *   pkey: 'MOBILE',
   *   name: 'Mobile App',
   *   description: 'iOS and Android mobile application',
   *   template: 'scrum',
   *   classification: 'restricted'
   * }, currentUserId);
   * ```
   */
  async create(project: ProjectInsert, userId: string): Promise<ProjectRow> {
    // First create the project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        pkey: project.pkey,
        name: project.name,
        description: project.description,
        project_type: project.project_type || 'software',
        template: project.template || 'scrum',
        classification: project.classification || 'restricted',
        program_id: project.program_id,
        lead_id: userId,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Add creator as project admin
    const { data: adminRole } = await supabase
      .from('project_roles')
      .select('id')
      .eq('name', 'Administrators')
      .single();

    if (adminRole) {
      await supabase.from('project_role_actors').insert({
        project_id: projectData.id,
        role_id: adminRole.id,
        user_id: userId,
      });
    }

    // Create default board with template-appropriate type
    const template = project.template || 'scrum';
    // Map all templates to the three core board types
    const getBoardType = (t: string): 'scrum' | 'kanban' | 'basic' => {
      if (t === 'kanban') return 'kanban';
      if (t === 'basic' || t === 'task_management' || t === 'process_management') return 'basic';
      return 'scrum'; // scrum, project_management
    };
    const boardType = getBoardType(template);
    
    const { data: boardData } = await supabase.from('boards').insert({
      name: `${project.name} Board`,
      project_id: projectData.id,
      board_type: boardType === 'basic' ? 'scrum' : boardType, // DB only supports scrum/kanban
      owner_id: userId,
    }).select().single();

    // Create template-specific columns immediately so board is ready
    if (boardData) {
      await boardService.createDefaultColumns(boardData.id, boardType);
    }

    return projectData as ProjectRow;
  },

  /**
   * Updates an existing project.
   * 
   * @param id - UUID of the project to update
   * @param updates - Partial project data to update
   * @returns The updated project row
   * @throws {Error} If database update fails
   * 
   * @example
   * ```typescript
   * const updated = await projectService.update(projectId, {
   *   name: 'Updated Project Name',
   *   description: 'New description'
   * });
   * ```
   */
  async update(id: string, updates: Partial<ProjectInsert>): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectRow;
  },

  /**
   * Archives a project (soft delete).
   * Archived projects are excluded from normal queries but data is preserved.
   * 
   * @param id - UUID of the project to archive
   * @throws {Error} If database update fails
   * 
   * @example
   * ```typescript
   * await projectService.archive(projectId);
   * // Project is now hidden from getAll() and getAllPaginated()
   * ```
   */
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;
  },
};
