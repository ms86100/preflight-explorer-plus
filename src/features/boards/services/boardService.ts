import { supabase } from '@/integrations/supabase/client';

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

export interface BoardColumnRow {
  id: string;
  board_id: string;
  name: string;
  position: number;
  min_issues: number | null;
  max_issues: number | null;
  created_at: string;
}

export const boardService = {
  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) throw error;
    return data as BoardRow[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as BoardRow;
  },

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

  async createDefaultColumns(boardId: string) {
    // Get all statuses
    const { data: statuses } = await supabase
      .from('issue_statuses')
      .select('id, name, category')
      .order('position');

    if (!statuses) return;

    // Group by category for default column setup
    const todoStatuses = statuses.filter(s => s.category === 'todo');
    const inProgressStatuses = statuses.filter(s => s.category === 'in_progress');
    const doneStatuses = statuses.filter(s => s.category === 'done');

    const columns = [
      { name: 'To Do', position: 0, statuses: todoStatuses },
      { name: 'In Progress', position: 1, statuses: inProgressStatuses, max_issues: 5 },
      { name: 'Done', position: 2, statuses: doneStatuses },
    ];

    for (const col of columns) {
      const { data: column } = await supabase
        .from('board_columns')
        .insert({
          board_id: boardId,
          name: col.name,
          position: col.position,
          max_issues: col.max_issues,
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

export const sprintService = {
  async getByBoard(boardId: string) {
    const { data, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SprintRow[];
  },

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

  async create(sprint: { board_id: string; name: string; goal?: string; start_date?: string; end_date?: string }) {
    const { data, error } = await supabase
      .from('sprints')
      .insert(sprint)
      .select()
      .single();

    if (error) throw error;
    return data as SprintRow;
  },

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

  async addIssue(sprintId: string, issueId: string) {
    const { error } = await supabase
      .from('sprint_issues')
      .insert({ sprint_id: sprintId, issue_id: issueId });

    if (error) throw error;
  },

  async removeIssue(sprintId: string, issueId: string) {
    const { error } = await supabase
      .from('sprint_issues')
      .delete()
      .eq('sprint_id', sprintId)
      .eq('issue_id', issueId);

    if (error) throw error;
  },

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
    
    // Fetch profiles for assignees
    const assigneeIds = [...new Set(issues.map(i => i?.assignee_id).filter(Boolean))];
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', assigneeIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return issues.map(issue => ({
        ...issue,
        assignee: issue?.assignee_id ? profileMap.get(issue.assignee_id) || null : null,
      }));
    }
    
    return issues.map(issue => ({ ...issue, assignee: null }));
  },
};
