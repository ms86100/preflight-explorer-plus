import { TableSchema } from '../types';

export const coreTablesSchema: TableSchema[] = [
  {
    name: 'projects',
    description: 'Core project entity containing all project configuration and metadata.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Project display name' },
      { name: 'project_key', type: 'TEXT', nullable: false, description: 'Unique short key (e.g., PROJ)' },
      { name: 'description', type: 'TEXT', nullable: true, description: 'Project description' },
      { name: 'project_type', type: 'ENUM', nullable: true, default: 'software', description: 'Project methodology type' },
      { name: 'lead_id', type: 'UUID', nullable: true, description: 'Project lead user reference' },
      { name: 'default_assignee_type', type: 'ENUM', nullable: true, description: 'How to assign new issues' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Last update timestamp' }
    ],
    relationships: [
      { table: 'issues', type: 'one-to-many', foreignKey: 'project_id' },
      { table: 'boards', type: 'one-to-many', foreignKey: 'project_id' },
      { table: 'sprints', type: 'one-to-many', foreignKey: 'project_id' },
      { table: 'versions', type: 'one-to-many', foreignKey: 'project_id' },
      { table: 'components', type: 'one-to-many', foreignKey: 'project_id' }
    ],
    rlsPolicies: ['Users can view projects they have access to', 'Admins can create/edit projects']
  },
  {
    name: 'issues',
    description: 'Work items including bugs, stories, tasks, and epics.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'issue_key', type: 'TEXT', nullable: false, description: 'Human-readable key (e.g., PROJ-123)' },
      { name: 'issue_number', type: 'INTEGER', nullable: false, description: 'Sequential number within project' },
      { name: 'summary', type: 'TEXT', nullable: false, description: 'Issue title/summary' },
      { name: 'description', type: 'TEXT', nullable: true, description: 'Detailed description' },
      { name: 'project_id', type: 'UUID', nullable: false, description: 'Parent project reference' },
      { name: 'issue_type_id', type: 'UUID', nullable: false, description: 'Issue type reference' },
      { name: 'status_id', type: 'UUID', nullable: false, description: 'Current status reference' },
      { name: 'priority_id', type: 'UUID', nullable: true, description: 'Priority level reference' },
      { name: 'assignee_id', type: 'UUID', nullable: true, description: 'Assigned user reference' },
      { name: 'reporter_id', type: 'UUID', nullable: false, description: 'Reporter user reference' },
      { name: 'parent_id', type: 'UUID', nullable: true, description: 'Parent issue for subtasks' },
      { name: 'epic_id', type: 'UUID', nullable: true, description: 'Epic issue reference' },
      { name: 'story_points', type: 'INTEGER', nullable: true, description: 'Estimation in story points' },
      { name: 'due_date', type: 'DATE', nullable: true, description: 'Due date' },
      { name: 'lexorank', type: 'TEXT', nullable: true, description: 'Ordering key for drag-drop' },
      { name: 'classification', type: 'ENUM', nullable: true, description: 'Data classification level' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Last update timestamp' }
    ],
    relationships: [
      { table: 'projects', type: 'many-to-many', foreignKey: 'project_id' },
      { table: 'issue_types', type: 'many-to-many', foreignKey: 'issue_type_id' },
      { table: 'issue_statuses', type: 'many-to-many', foreignKey: 'status_id' },
      { table: 'comments', type: 'one-to-many', foreignKey: 'issue_id' },
      { table: 'attachments', type: 'one-to-many', foreignKey: 'issue_id' },
      { table: 'issue_history', type: 'one-to-many', foreignKey: 'issue_id' }
    ],
    rlsPolicies: ['Users can view issues in accessible projects', 'Users can edit assigned issues', 'Reporters can edit their issues']
  },
  {
    name: 'issue_statuses',
    description: 'Workflow statuses that issues can be in.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Status display name' },
      { name: 'description', type: 'TEXT', nullable: true, description: 'Status description' },
      { name: 'category', type: 'ENUM', nullable: true, description: 'Status category (todo, in_progress, done)' },
      { name: 'color', type: 'TEXT', nullable: true, description: 'Display color hex code' },
      { name: 'position', type: 'INTEGER', nullable: true, description: 'Sort order' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Creation timestamp' }
    ],
    relationships: [
      { table: 'issues', type: 'one-to-many', foreignKey: 'status_id' },
      { table: 'workflow_transitions', type: 'one-to-many', foreignKey: 'from_status_id' },
      { table: 'workflow_transitions', type: 'one-to-many', foreignKey: 'to_status_id' }
    ],
    rlsPolicies: ['All authenticated users can view statuses', 'Only admins can modify statuses']
  },
  {
    name: 'sprints',
    description: 'Time-boxed iterations for Scrum projects.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Sprint name' },
      { name: 'goal', type: 'TEXT', nullable: true, description: 'Sprint goal description' },
      { name: 'project_id', type: 'UUID', nullable: false, description: 'Parent project reference' },
      { name: 'start_date', type: 'DATE', nullable: true, description: 'Sprint start date' },
      { name: 'end_date', type: 'DATE', nullable: true, description: 'Sprint end date' },
      { name: 'status', type: 'ENUM', nullable: true, default: 'future', description: 'Sprint status (future, active, closed)' },
      { name: 'completed_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Completion timestamp' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Creation timestamp' }
    ],
    relationships: [
      { table: 'projects', type: 'many-to-many', foreignKey: 'project_id' },
      { table: 'sprint_issues', type: 'one-to-many', foreignKey: 'sprint_id' }
    ],
    rlsPolicies: ['Users can view sprints in accessible projects', 'Project members can manage sprints']
  },
  {
    name: 'boards',
    description: 'Kanban or Scrum boards for visualizing work.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Board name' },
      { name: 'project_id', type: 'UUID', nullable: false, description: 'Parent project reference' },
      { name: 'board_type', type: 'ENUM', nullable: true, description: 'Board type (kanban, scrum)' },
      { name: 'owner_id', type: 'UUID', nullable: true, description: 'Board owner user reference' },
      { name: 'filter_jql', type: 'TEXT', nullable: true, description: 'JQL filter for board issues' },
      { name: 'is_private', type: 'BOOLEAN', nullable: true, default: 'false', description: 'Private board flag' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Creation timestamp' }
    ],
    relationships: [
      { table: 'projects', type: 'many-to-many', foreignKey: 'project_id' },
      { table: 'board_columns', type: 'one-to-many', foreignKey: 'board_id' }
    ],
    rlsPolicies: ['Users can view non-private boards in accessible projects', 'Board owners can edit their boards']
  }
];

export const gitTablesSchema: TableSchema[] = [
  {
    name: 'git_organizations',
    description: 'Connected Git provider organizations (GitHub, GitLab, Bitbucket).',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Organization display name' },
      { name: 'provider_type', type: 'TEXT', nullable: false, description: 'Git provider (github, gitlab, bitbucket)' },
      { name: 'host_url', type: 'TEXT', nullable: false, description: 'Provider host URL' },
      { name: 'access_token_encrypted', type: 'TEXT', nullable: true, description: 'Encrypted OAuth token' },
      { name: 'is_active', type: 'BOOLEAN', nullable: true, default: 'true', description: 'Active connection flag' },
      { name: 'last_sync_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Last sync timestamp' },
      { name: 'created_by', type: 'UUID', nullable: true, description: 'User who created connection' }
    ],
    relationships: [
      { table: 'git_repositories', type: 'one-to-many', foreignKey: 'organization_id' },
      { table: 'git_user_mappings', type: 'one-to-many', foreignKey: 'organization_id' }
    ],
    rlsPolicies: ['Admins can manage organizations', 'Users can view connected organizations']
  },
  {
    name: 'git_commits',
    description: 'Commits synced from connected repositories.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'commit_hash', type: 'TEXT', nullable: false, description: 'Git commit SHA' },
      { name: 'message', type: 'TEXT', nullable: true, description: 'Commit message' },
      { name: 'author_name', type: 'TEXT', nullable: true, description: 'Commit author name' },
      { name: 'author_email', type: 'TEXT', nullable: true, description: 'Commit author email' },
      { name: 'repository_id', type: 'UUID', nullable: true, description: 'Repository reference' },
      { name: 'committed_at', type: 'TIMESTAMPTZ', nullable: true, description: 'Commit timestamp' },
      { name: 'additions', type: 'INTEGER', nullable: true, description: 'Lines added' },
      { name: 'deletions', type: 'INTEGER', nullable: true, description: 'Lines deleted' },
      { name: 'web_url', type: 'TEXT', nullable: true, description: 'Link to commit on provider' }
    ],
    relationships: [
      { table: 'git_repositories', type: 'many-to-many', foreignKey: 'repository_id' },
      { table: 'git_commit_issues', type: 'one-to-many', foreignKey: 'commit_id' }
    ],
    rlsPolicies: ['Users can view commits from accessible repositories']
  }
];

export const workflowTablesSchema: TableSchema[] = [
  {
    name: 'workflows',
    description: 'Workflow definitions for issue state management.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Workflow name' },
      { name: 'description', type: 'TEXT', nullable: true, description: 'Workflow description' },
      { name: 'is_active', type: 'BOOLEAN', nullable: true, default: 'true', description: 'Active workflow flag' },
      { name: 'created_by', type: 'UUID', nullable: true, description: 'Creator user reference' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, default: 'now()', description: 'Creation timestamp' }
    ],
    relationships: [
      { table: 'workflow_transitions', type: 'one-to-many', foreignKey: 'workflow_id' },
      { table: 'workflow_schemes', type: 'one-to-many', foreignKey: 'workflow_id' }
    ],
    rlsPolicies: ['All users can view workflows', 'Only admins can modify workflows']
  },
  {
    name: 'workflow_transitions',
    description: 'Allowed transitions between statuses in a workflow.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
      { name: 'workflow_id', type: 'UUID', nullable: false, description: 'Parent workflow reference' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Transition display name' },
      { name: 'from_status_id', type: 'UUID', nullable: true, description: 'Source status (null = any)' },
      { name: 'to_status_id', type: 'UUID', nullable: false, description: 'Target status' },
      { name: 'conditions', type: 'JSONB', nullable: true, description: 'Transition conditions' },
      { name: 'validators', type: 'JSONB', nullable: true, description: 'Transition validators' },
      { name: 'post_functions', type: 'JSONB', nullable: true, description: 'Post-transition actions' }
    ],
    relationships: [
      { table: 'workflows', type: 'many-to-many', foreignKey: 'workflow_id' },
      { table: 'issue_statuses', type: 'many-to-many', foreignKey: 'from_status_id' },
      { table: 'issue_statuses', type: 'many-to-many', foreignKey: 'to_status_id' }
    ],
    rlsPolicies: ['All users can view transitions', 'Only admins can modify transitions']
  }
];

export const tableCategories = [
  { name: 'Core', tables: ['projects', 'issues', 'issue_types', 'issue_statuses', 'priorities', 'resolutions'], count: 6 },
  { name: 'Boards & Sprints', tables: ['boards', 'board_columns', 'sprints', 'sprint_issues'], count: 4 },
  { name: 'Workflows', tables: ['workflows', 'workflow_transitions', 'workflow_schemes'], count: 3 },
  { name: 'Git Integration', tables: ['git_organizations', 'git_repositories', 'git_commits', 'git_branches', 'git_pull_requests', 'git_builds', 'git_deployments'], count: 7 },
  { name: 'Custom Fields', tables: ['custom_field_definitions', 'custom_field_values', 'custom_field_contexts'], count: 3 },
  { name: 'Comments & Activity', tables: ['comments', 'comment_mentions', 'issue_history', 'audit_logs'], count: 4 },
  { name: 'Users & Teams', tables: ['profiles', 'teams', 'team_members', 'groups', 'group_memberships'], count: 5 },
  { name: 'Automation', tables: ['automation_rules', 'automation_logs'], count: 2 },
  { name: 'Documents', tables: ['document_templates', 'document_exports'], count: 2 },
  { name: 'Import/Export', tables: ['import_jobs', 'import_errors', 'import_mappings', 'export_audit_logs'], count: 4 }
];
