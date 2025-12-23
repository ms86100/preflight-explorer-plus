/**
 * @fileoverview Unit tests for projectService
 * @module features/projects/services/projectService.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService, type ProjectInsert, type ProjectRow } from './projectService';

const mockProjects: ProjectRow[] = [
  {
    id: 'proj-1',
    pkey: 'DEMO',
    name: 'Demo Project',
    description: 'A demo project',
    project_type: 'software',
    template: 'scrum',
    category_id: null,
    lead_id: 'user-1',
    default_assignee_id: null,
    avatar_url: null,
    url: null,
    issue_counter: 10,
    is_archived: false,
    classification: 'restricted',
    program_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockCreatedProject: ProjectRow = {
  id: 'proj-new',
  pkey: 'NEW',
  name: 'New Project',
  description: null,
  project_type: 'software',
  template: 'scrum',
  category_id: null,
  lead_id: 'user-1',
  default_assignee_id: null,
  avatar_url: null,
  url: null,
  issue_counter: 0,
  is_archived: false,
  classification: 'restricted',
  program_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock factory functions moved to module scope (S2004)
function createDefaultFromMock() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
            count: mockProjects.length,
          }),
        }),
        single: vi.fn().mockResolvedValue({
          data: mockProjects[0],
          error: null,
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockCreatedProject,
          error: null,
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockProjects[0], name: 'Updated Name' },
            error: null,
          }),
        }),
      }),
    }),
  };
}

// Mock supabase client - flattened structure (S2004)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => createDefaultFromMock()),
  },
}));

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPaginated', () => {
    it('should return paginated projects with default pagination', async () => {
      const result = await projectService.getAllPaginated();
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination.page).toBe(1);
    });

    it('should apply search filter correctly', async () => {
      const result = await projectService.getAllPaginated(
        { page: 1, pageSize: 10 },
        { search: 'Demo' }
      );
      
      expect(result).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should return array of projects', async () => {
      const result = await projectService.getAll();
      
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('getByKey', () => {
    it('should return project by key', async () => {
      const result = await projectService.getByKey('DEMO');
      
      expect(result).toBeDefined();
      expect(result.pkey).toBe('DEMO');
    });
  });

  describe('getById', () => {
    it('should return project by ID', async () => {
      const result = await projectService.getById('proj-1');
      
      expect(result).toBeDefined();
    });
  });
});

describe('ProjectInsert interface', () => {
  it('should accept valid project data', () => {
    const validProject: ProjectInsert = {
      pkey: 'TEST',
      name: 'Test Project',
      description: 'A test project',
      project_type: 'software',
      template: 'scrum',
    };
    
    expect(validProject.pkey).toBe('TEST');
    expect(validProject.name).toBe('Test Project');
  });

  it('should require only pkey and name', () => {
    const minimalProject: ProjectInsert = {
      pkey: 'MIN',
      name: 'Minimal Project',
    };
    
    expect(minimalProject.pkey).toBe('MIN');
    expect(minimalProject.description).toBeUndefined();
  });
});

describe('ProjectRow interface', () => {
  it('should have all required fields', () => {
    const project: ProjectRow = mockProjects[0];
    
    expect(project.id).toBeDefined();
    expect(project.pkey).toBeDefined();
    expect(project.name).toBeDefined();
    expect(project.created_at).toBeDefined();
    expect(project.updated_at).toBeDefined();
  });
});
