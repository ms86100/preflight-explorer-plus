import { supabase } from '@/integrations/supabase/client';
import type { ClassificationLevel, ProjectTemplate, ProjectType } from '@/types/jira';
import {
  type PaginationParams,
  type PaginatedResult,
  getPaginationRange,
  buildPaginatedResult,
  DEFAULT_PAGE_SIZE,
} from '@/lib/pagination';

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

export interface ProjectFilters {
  search?: string;
  projectType?: ProjectType;
  classification?: ClassificationLevel;
}

export const projectService = {
  // Paginated query for large datasets
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

  // Keep non-paginated for backward compatibility (limited to 100)
  async getAll() {
    const result = await this.getAllPaginated({ page: 1, pageSize: 100 });
    return result.data;
  },

  async getByKey(pkey: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('pkey', pkey)
      .single();

    if (error) throw error;
    return data as ProjectRow;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ProjectRow;
  },

  async create(project: ProjectInsert, userId: string) {
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

    // Create default board
    await supabase.from('boards').insert({
      name: `${project.name} Board`,
      project_id: projectData.id,
      board_type: project.template === 'kanban' ? 'kanban' : 'scrum',
      owner_id: userId,
    });

    return projectData as ProjectRow;
  },

  async update(id: string, updates: Partial<ProjectInsert>) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectRow;
  },

  async archive(id: string) {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;
  },
};
