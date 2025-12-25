import { ModuleDoc } from '../types';

export const moduleDocumentation: ModuleDoc[] = [
  {
    id: 'projects',
    name: 'Projects',
    description: 'Project management and configuration',
    purpose: 'Provides the foundation for organizing work. Each project contains issues, boards, workflows, and team configurations.',
    components: ['CreateProjectModal.tsx'],
    hooks: ['useProjects.ts'],
    services: ['projectService.ts'],
    userFlow: [
      'User navigates to Projects page',
      'Clicks "Create Project" button',
      'Fills in project details (name, key, description)',
      'Selects project type (Kanban/Scrum)',
      'Project is created with default configurations',
      'User is redirected to the new project board'
    ],
    roles: {
      admin: ['Create projects', 'Delete projects', 'Modify project settings', 'Manage project permissions'],
      user: ['View assigned projects', 'Access project boards', 'Create issues within projects']
    },
    preconditions: ['User must be authenticated', 'User must have project creation permissions'],
    postconditions: ['Project appears in project list', 'Default board is created', 'Default statuses are applied'],
    edgeCases: ['Duplicate project key validation', 'Project key format validation (uppercase, no spaces)', 'Maximum project name length'],
    associatedDiagrams: ['system-architecture', 'core-erd']
  },
  {
    id: 'issues',
    name: 'Issues',
    description: 'Issue creation, tracking, and management',
    purpose: 'Core work item tracking. Issues represent tasks, bugs, stories, or epics that teams work on.',
    components: ['CreateIssueModal.tsx', 'IssueDetailModal.tsx', 'AttachmentsSection.tsx', 'ComponentsSection.tsx', 'IssueHistorySection.tsx', 'LinkedIssuesSection.tsx', 'TimeTrackingSection.tsx', 'VersionsSection.tsx'],
    hooks: ['useIssues.ts'],
    services: ['issueService.ts'],
    userFlow: [
      'User clicks "Create Issue" or uses keyboard shortcut',
      'Selects issue type (Bug, Story, Task, Epic)',
      'Fills required fields (summary, description)',
      'Optionally sets assignee, priority, labels, sprint',
      'Issue is created with auto-generated key (e.g., PROJ-123)',
      'Issue appears on board/backlog based on status'
    ],
    roles: {
      admin: ['Delete any issue', 'Bulk operations', 'Configure issue types'],
      user: ['Create issues', 'Edit assigned issues', 'Transition issues', 'Add comments', 'Log time']
    },
    preconditions: ['Project must exist', 'User must have issue creation permission', 'Required fields must be filled'],
    postconditions: ['Issue key is generated', 'Issue history is initialized', 'Notifications are sent to watchers'],
    edgeCases: ['Issue key collision handling', 'Circular parent-child prevention', 'Epic link validation', 'Time tracking overflow'],
    associatedDiagrams: ['issue-lifecycle', 'core-erd', 'data-flow']
  },
  {
    id: 'boards',
    name: 'Boards',
    description: 'Kanban and Scrum board visualization',
    purpose: 'Visual representation of work progress. Boards display issues in columns representing workflow states.',
    components: ['BasicBoard.tsx', 'BoardColumn.tsx', 'BoardSettingsModal.tsx', 'BoardToolbar.tsx', 'ColumnConfigPanel.tsx', 'IssueCard.tsx', 'KanbanBoard.tsx', 'ScrumBoard.tsx', 'SprintHeader.tsx'],
    hooks: ['useBoardState.ts', 'useBoardTransitionValidation.ts', 'useBoards.ts'],
    services: ['boardService.ts'],
    userFlow: [
      'User navigates to project board',
      'Board displays columns based on workflow',
      'User drags issue card to new column',
      'Transition validation is checked',
      'Issue status is updated',
      'Board reflects new state'
    ],
    roles: {
      admin: ['Configure board columns', 'Set WIP limits', 'Manage board filters'],
      user: ['View board', 'Drag issues between columns', 'Quick edit issues', 'Filter board view']
    },
    preconditions: ['Board must be configured', 'User must have board access', 'Workflow must allow transition'],
    postconditions: ['Issue status is updated', 'Board column counts update', 'Activity is logged'],
    edgeCases: ['WIP limit exceeded warning', 'Invalid transition blocking', 'Concurrent drag operations', 'Large board performance'],
    associatedDiagrams: ['board-interaction', 'system-architecture']
  },
  {
    id: 'backlog',
    name: 'Backlog',
    description: 'Sprint planning and backlog management',
    purpose: 'Prioritize and organize work items. Manage sprints, plan capacity, and track velocity.',
    components: ['BacklogView.tsx', 'DraggableBacklogView.tsx', 'SprintActivityFeed.tsx', 'SprintCardContent.tsx', 'SprintCompletionModal.tsx', 'SprintConfigModal.tsx', 'SprintHistoryPage.tsx', 'SprintHistoryView.tsx', 'SprintPlanningModal.tsx'],
    hooks: ['useCompletedSprints.ts'],
    services: [],
    userFlow: [
      'User views product backlog',
      'Prioritizes issues by dragging to reorder',
      'Creates new sprint with dates and goals',
      'Drags issues into sprint',
      'Starts sprint when ready',
      'Completes sprint and handles incomplete items'
    ],
    roles: {
      admin: ['Create/delete sprints', 'Configure sprint settings', 'Override sprint completion'],
      user: ['View backlog', 'Reorder items', 'Move issues to sprints', 'View sprint reports']
    },
    preconditions: ['Project must use Scrum methodology', 'Backlog must have issues', 'Sprint dates must be valid'],
    postconditions: ['Sprint velocity is calculated', 'Incomplete items are handled', 'Sprint report is generated'],
    edgeCases: ['Overlapping sprint dates', 'Empty sprint completion', 'Mid-sprint scope changes', 'Sprint goal modification'],
    associatedDiagrams: ['sprint-planning', 'core-erd']
  },
  {
    id: 'workflows',
    name: 'Workflows',
    description: 'Workflow design and transition rules',
    purpose: 'Define how issues move through their lifecycle. Configure statuses, transitions, and validation rules.',
    components: ['TransitionEditor.tsx', 'WorkflowComparison.tsx', 'WorkflowDesigner.tsx', 'WorkflowImportExport.tsx', 'WorkflowList.tsx', 'WorkflowSchemeManager.tsx'],
    hooks: ['useWorkflowExecution.ts', 'useWorkflows.ts'],
    services: ['workflowExecutionService.ts', 'workflowService.ts'],
    userFlow: [
      'Admin navigates to Workflow settings',
      'Creates new workflow or edits existing',
      'Adds statuses and connects with transitions',
      'Configures transition conditions and validators',
      'Associates workflow with issue types',
      'Workflow is active for new issues'
    ],
    roles: {
      admin: ['Create/edit workflows', 'Manage workflow schemes', 'Import/export workflows'],
      user: ['View workflow (if permitted)', 'Cannot modify workflows']
    },
    preconditions: ['Admin permissions required', 'Valid status configuration', 'No circular transitions'],
    postconditions: ['Workflow is validated', 'Existing issues can still transition', 'Scheme is updated'],
    edgeCases: ['Orphaned status handling', 'Breaking change detection', 'Workflow migration', 'Concurrent edits'],
    associatedDiagrams: ['issue-lifecycle', 'module-dependencies']
  },
  {
    id: 'git-integration',
    name: 'Git Integration',
    description: 'Repository connection and development tracking',
    purpose: 'Connect Git repositories to track commits, branches, pull requests, and deployments linked to issues.',
    components: ['BranchesList.tsx', 'BuildStatusBadge.tsx', 'CommitsList.tsx', 'CreateBranchModal.tsx', 'CreatePRModal.tsx', 'DeploymentsList.tsx', 'DevelopmentPanel.tsx', 'GitDemoToggle.tsx', 'GitIntegrationPanel.tsx', 'GitOrganizationForm.tsx', 'GitOrganizationsList.tsx', 'GitUserMappingManager.tsx', 'PullRequestsList.tsx', 'RepositoryLinker.tsx', 'RepositorySettingsModal.tsx', 'SyncStatusIndicator.tsx', 'TriggerBuildModal.tsx'],
    hooks: ['useGitModalRepositories.ts', 'useGitOrganizations.ts', 'useGitRepositories.ts', 'useIssueDevelopmentInfo.ts'],
    services: ['gitIntegrationService.ts', 'smartCommitParser.ts'],
    userFlow: [
      'Admin connects Git organization (GitHub/GitLab/Bitbucket)',
      'OAuth flow authenticates connection',
      'Repositories are synced',
      'Project is linked to repository',
      'Commits referencing issue keys are tracked',
      'Smart commits can transition issues'
    ],
    roles: {
      admin: ['Connect organizations', 'Link repositories', 'Configure webhooks', 'Manage user mappings'],
      user: ['View development info on issues', 'Create branches from issues', 'View commit history']
    },
    preconditions: ['Git provider account required', 'OAuth app configured', 'Repository access granted'],
    postconditions: ['Commits are linked to issues', 'Branches appear on issue panel', 'Smart commits are processed'],
    edgeCases: ['OAuth token expiration', 'Webhook delivery failures', 'Repository rename handling', 'User mapping conflicts'],
    associatedDiagrams: ['git-integration-flow', 'git-erd']
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Project metrics and performance tracking',
    purpose: 'Visualize team performance, sprint progress, and project health through various charts and reports.',
    components: ['AgeingChart.tsx', 'BurndownChart.tsx', 'ContributorPerformance.tsx', 'ControlChart.tsx', 'CumulativeFlowChart.tsx', 'ExecutiveSummary.tsx', 'IssueTypeDistribution.tsx', 'LeadCycleTimeChart.tsx', 'OverdueAnalysis.tsx', 'PriorityBreakdown.tsx', 'RecentActivity.tsx', 'ReleaseBurndown.tsx', 'ResolutionTimeChart.tsx', 'SprintReport.tsx', 'TeamWorkloadChart.tsx', 'TrendAnalysis.tsx', 'VelocityChart.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'User navigates to Reports page',
      'Selects report type from available options',
      'Configures date range and filters',
      'Report data is fetched and visualized',
      'User can export or share report'
    ],
    roles: {
      admin: ['Access all reports', 'Configure report permissions', 'Schedule report delivery'],
      user: ['View permitted reports', 'Filter by assigned items', 'Export personal reports']
    },
    preconditions: ['Sufficient data for visualization', 'Report access permission', 'Valid date range'],
    postconditions: ['Report is rendered', 'Data is cached for performance', 'Export is generated'],
    edgeCases: ['No data scenarios', 'Large dataset performance', 'Date timezone handling', 'Incomplete sprint data'],
    associatedDiagrams: ['data-flow', 'module-dependencies']
  },
  {
    id: 'custom-fields',
    name: 'Custom Fields',
    description: 'Dynamic field configuration for issues',
    purpose: 'Extend issue data with custom fields tailored to organization needs. Support various field types and contexts.',
    components: ['CustomFieldInput.tsx', 'CustomFieldsForm.tsx', 'CustomFieldsManager.tsx'],
    hooks: ['useCustomFields.ts'],
    services: ['customFieldService.ts'],
    userFlow: [
      'Admin creates new custom field definition',
      'Selects field type (text, number, date, select, etc.)',
      'Configures options and validation rules',
      'Assigns field to issue type contexts',
      'Field appears on issue create/edit forms',
      'Values are stored and searchable'
    ],
    roles: {
      admin: ['Create/edit field definitions', 'Manage field contexts', 'Delete unused fields'],
      user: ['View custom fields', 'Edit custom field values on issues']
    },
    preconditions: ['Admin permission for configuration', 'Valid field type selection', 'Context assignment'],
    postconditions: ['Field is available on forms', 'Existing issues can be updated', 'Search includes field'],
    edgeCases: ['Field type change restrictions', 'Required field enforcement', 'Default value application', 'Field deletion with data'],
    associatedDiagrams: ['core-erd', 'data-flow']
  },
  {
    id: 'teams',
    name: 'Teams',
    description: 'Team organization and membership',
    purpose: 'Group users into teams for assignment, permissions, and workload management.',
    components: ['TeamManager.tsx'],
    hooks: ['useTeams.ts'],
    services: ['teamService.ts'],
    userFlow: [
      'Admin navigates to Team management',
      'Creates new team with name and description',
      'Adds members to team',
      'Assigns team lead',
      'Team can be assigned to issues',
      'Team workload is visible in reports'
    ],
    roles: {
      admin: ['Create/delete teams', 'Manage all team memberships', 'Configure team settings'],
      user: ['View team membership', 'See team assignments']
    },
    preconditions: ['Admin permission required', 'Users must exist to add', 'Unique team name'],
    postconditions: ['Team is created', 'Members are associated', 'Team is available for assignment'],
    edgeCases: ['User removal from team with active assignments', 'Team deletion with history', 'Circular team lead assignment'],
    associatedDiagrams: ['core-erd']
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'In-app notification system',
    purpose: 'Alert users about relevant activities like assignments, mentions, and status changes.',
    components: ['NotificationBell.tsx', 'NotificationsList.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Activity triggers notification (assignment, mention, etc.)',
      'Notification is created for relevant users',
      'Bell icon shows unread count',
      'User clicks to view notification list',
      'Clicking notification navigates to relevant item',
      'Notification is marked as read'
    ],
    roles: {
      admin: ['Configure notification rules', 'View system-wide notifications'],
      user: ['Receive personal notifications', 'Mark as read/unread', 'Configure preferences']
    },
    preconditions: ['User is subscribed to activity', 'Notification type is enabled'],
    postconditions: ['Notification is delivered', 'Unread count is updated', 'Activity is logged'],
    edgeCases: ['High-volume notification batching', 'Deleted item notifications', 'Permission changes affecting subscriptions'],
    associatedDiagrams: ['data-flow']
  },
  {
    id: 'comments',
    name: 'Comments & Mentions',
    description: 'Issue discussion and @mention system',
    purpose: 'Enable team collaboration through issue comments with rich text and user mentions.',
    components: ['MentionTextarea.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'User opens issue detail',
      'Navigates to comments section',
      'Types comment with optional @mentions',
      'Mention autocomplete suggests users',
      'Comment is posted',
      'Mentioned users are notified'
    ],
    roles: {
      admin: ['Delete any comment', 'Moderate discussions'],
      user: ['Add comments', 'Edit own comments', 'Mention other users']
    },
    preconditions: ['Issue access required', 'Comment permission granted'],
    postconditions: ['Comment is saved', 'Mentions are extracted', 'Notifications sent'],
    edgeCases: ['Editing mentions after post', 'Deleted user mentions', 'Long comment handling', 'Concurrent edits'],
    associatedDiagrams: ['core-erd']
  },
  {
    id: 'automation',
    name: 'Automation Rules',
    description: 'Workflow automation and triggers',
    purpose: 'Automate repetitive tasks with rule-based triggers, conditions, and actions.',
    components: [],
    hooks: [],
    services: [],
    userFlow: [
      'Admin navigates to Automation settings',
      'Creates new automation rule',
      'Defines trigger (issue created, status changed, etc.)',
      'Adds conditions to filter when rule applies',
      'Configures actions (assign, transition, notify)',
      'Rule is enabled and runs automatically'
    ],
    roles: {
      admin: ['Create/edit automation rules', 'View execution logs', 'Disable/enable rules'],
      user: ['Cannot access automation configuration']
    },
    preconditions: ['Admin permission required', 'Valid trigger/action combination'],
    postconditions: ['Rule is saved', 'Trigger is registered', 'Actions execute on match'],
    edgeCases: ['Rule loop prevention', 'Failed action handling', 'Rate limiting', 'Permission context for actions'],
    associatedDiagrams: ['module-dependencies']
  },
  {
    id: 'migration',
    name: 'Data Migration',
    description: 'Import/export and data migration tools',
    purpose: 'Import data from external systems (CSV, other tools) and export for backup or migration.',
    components: ['CSVUploader.tsx', 'FieldMapper.tsx', 'FormatGuideModal.tsx', 'ImportHistory.tsx', 'ImportProgress.tsx', 'ImportWizard.tsx', 'TemplateDownload.tsx', 'ValidationPreview.tsx'],
    hooks: [],
    services: ['importService.ts', 'templateService.ts'],
    userFlow: [
      'Admin opens Import wizard',
      'Selects import type (issues, users, etc.)',
      'Uploads CSV or connects to source',
      'Maps source fields to system fields',
      'Validates data preview',
      'Executes import with progress tracking',
      'Reviews import results and errors'
    ],
    roles: {
      admin: ['Run imports', 'View import history', 'Download templates'],
      user: ['Cannot access migration tools']
    },
    preconditions: ['Admin permission required', 'Valid file format', 'Required fields mapped'],
    postconditions: ['Data is imported', 'Errors are logged', 'History is recorded'],
    edgeCases: ['Duplicate detection', 'Reference resolution', 'Large file handling', 'Partial failure recovery'],
    associatedDiagrams: ['data-flow']
  },
  {
    id: 'plugins',
    name: 'Plugins & Extensions',
    description: 'Plugin management and feature flags',
    purpose: 'Extend platform functionality with plugins and control feature availability.',
    components: ['FeatureGate.tsx'],
    hooks: ['usePlugins.ts'],
    services: ['pluginService.ts'],
    userFlow: [
      'Admin navigates to Plugins page',
      'Views available plugins',
      'Enables/disables plugins',
      'Configures plugin settings',
      'Plugin features become available',
      'Feature gates control UI visibility'
    ],
    roles: {
      admin: ['Enable/disable plugins', 'Configure plugin settings', 'Install new plugins'],
      user: ['Use enabled plugin features']
    },
    preconditions: ['Admin permission for management', 'Plugin compatibility verified'],
    postconditions: ['Plugin state is updated', 'Features are toggled', 'Dependencies are checked'],
    edgeCases: ['Plugin dependency conflicts', 'Version compatibility', 'Data migration on disable'],
    associatedDiagrams: ['module-dependencies', 'system-architecture']
  },
  {
    id: 'ldap',
    name: 'LDAP Integration',
    description: 'Directory service authentication and sync',
    purpose: 'Integrate with enterprise LDAP/Active Directory for user authentication and group synchronization.',
    components: ['GroupMappingManager.tsx', 'LdapConfigurationForm.tsx', 'LdapConfigurationList.tsx', 'LdapSyncPanel.tsx'],
    hooks: [],
    services: ['ldapService.ts'],
    userFlow: [
      'Admin configures LDAP server connection',
      'Tests connection with bind credentials',
      'Configures user and group search filters',
      'Maps LDAP groups to application roles',
      'Runs initial sync',
      'Schedules periodic sync'
    ],
    roles: {
      admin: ['Configure LDAP connections', 'Manage group mappings', 'Run manual syncs'],
      user: ['Authenticate via LDAP']
    },
    preconditions: ['LDAP server accessible', 'Valid bind credentials', 'Network connectivity'],
    postconditions: ['Users are synced', 'Groups are mapped', 'Authentication is enabled'],
    edgeCases: ['Connection timeouts', 'Certificate validation', 'User conflict resolution', 'Sync failures'],
    associatedDiagrams: ['user-authentication-flow', 'system-architecture']
  },
  {
    id: 'enterprise',
    name: 'Enterprise Features',
    description: 'Access control, audit logs, and bulk operations',
    purpose: 'Enterprise-grade security and administration features for compliance and large-scale management.',
    components: ['AccessControlManager.tsx', 'AuditLogsViewer.tsx', 'BulkOperations.tsx', 'PermissionSchemesManager.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Admin accesses Enterprise settings',
      'Configures permission schemes',
      'Reviews audit logs for compliance',
      'Performs bulk operations on issues',
      'Manages access control lists'
    ],
    roles: {
      admin: ['Full access to enterprise features', 'Configure security settings', 'View all audit logs'],
      user: ['Subject to access controls', 'Cannot view audit logs']
    },
    preconditions: ['Enterprise license active', 'Admin permissions required'],
    postconditions: ['Settings are applied', 'Audit trail is maintained', 'Bulk changes are logged'],
    edgeCases: ['Bulk operation rollback', 'Permission inheritance conflicts', 'Audit log retention'],
    associatedDiagrams: ['system-architecture', 'module-dependencies']
  },
  {
    id: 'compliance',
    name: 'Compliance & Classification',
    description: 'Data classification and compliance controls',
    purpose: 'Classify data sensitivity and enforce compliance policies for regulated industries.',
    components: ['ClassificationBadge.tsx', 'ComplianceDashboard.tsx', 'DataExportControls.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Admin configures classification levels',
      'Issues and attachments are classified',
      'Classification badges are displayed',
      'Export controls enforce policies',
      'Compliance dashboard shows status'
    ],
    roles: {
      admin: ['Configure classification levels', 'Set default classifications', 'Override classifications'],
      user: ['View classification badges', 'Cannot export restricted data']
    },
    preconditions: ['Compliance features enabled', 'Classification levels defined'],
    postconditions: ['Data is classified', 'Export restrictions enforced', 'Audit trail maintained'],
    edgeCases: ['Classification inheritance', 'Bulk reclassification', 'Export approval workflow'],
    associatedDiagrams: ['data-flow']
  },
  {
    id: 'document-composer',
    name: 'Document Composer',
    description: 'Document generation and export',
    purpose: 'Generate formatted documents from issue data using customizable templates.',
    components: ['DocumentComposer.tsx', 'ExportHistory.tsx', 'ExportWizard.tsx', 'TemplateEditor.tsx'],
    hooks: [],
    services: ['documentComposerService.ts'],
    userFlow: [
      'User selects issues for export',
      'Chooses or creates document template',
      'Configures header, footer, sections',
      'Previews document layout',
      'Generates document (PDF, DOCX)',
      'Downloads or shares document'
    ],
    roles: {
      admin: ['Create/edit templates', 'Configure default templates', 'Access all exports'],
      user: ['Use existing templates', 'Generate personal exports', 'View export history']
    },
    preconditions: ['Issues selected', 'Template available', 'Export permission granted'],
    postconditions: ['Document is generated', 'Export is logged', 'File is available for download'],
    edgeCases: ['Large document generation', 'Image embedding', 'Classification watermarks', 'Template variable resolution'],
    associatedDiagrams: ['data-flow']
  },
  {
    id: 'structured-data',
    name: 'Structured Data Blocks',
    description: 'Custom data schemas and matrix views',
    purpose: 'Define custom data structures for specialized data capture beyond standard fields.',
    components: ['DataMatrixView.tsx', 'SchemaEditor.tsx', 'StructuredDataBlocks.tsx'],
    hooks: [],
    services: ['structuredDataService.ts'],
    userFlow: [
      'Admin creates data block schema',
      'Defines columns with types and validation',
      'Associates schema with project/issue type',
      'Users add data block instances to issues',
      'Data is entered in matrix format',
      'Data is searchable and reportable'
    ],
    roles: {
      admin: ['Create/edit schemas', 'Manage schema versions', 'Configure validation'],
      user: ['Add/edit data block instances', 'View structured data']
    },
    preconditions: ['Schema defined', 'Context assigned', 'Validation rules valid'],
    postconditions: ['Data block created', 'Data validated', 'Instance saved'],
    edgeCases: ['Schema version migration', 'Column type changes', 'Required column addition', 'Large matrix performance'],
    associatedDiagrams: ['core-erd']
  },
  {
    id: 'guided-operations',
    name: 'Guided Operations',
    description: 'Step-by-step operation wizards',
    purpose: 'Guide users through complex multi-step operations with validation and rollback support.',
    components: ['GuidedOperations.tsx'],
    hooks: [],
    services: ['guidedOperationsService.ts'],
    userFlow: [
      'User initiates guided operation',
      'Views operation overview and steps',
      'Completes each step with validation',
      'Reviews changes before confirmation',
      'Operation executes with progress',
      'Results are displayed with rollback option'
    ],
    roles: {
      admin: ['Create operation definitions', 'Configure step requirements', 'Manage approvals'],
      user: ['Execute available operations', 'View execution history']
    },
    preconditions: ['Operation defined', 'User has execution permission', 'Prerequisites met'],
    postconditions: ['Operation completed', 'Results logged', 'Rollback available if supported'],
    edgeCases: ['Step failure recovery', 'Timeout handling', 'Concurrent execution prevention', 'Approval workflow'],
    associatedDiagrams: ['data-flow']
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Advanced issue search and filtering',
    purpose: 'Find issues across projects using various filters and search criteria.',
    components: ['IssueSearchView.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'User navigates to Search page',
      'Enters search query or selects filters',
      'Results are displayed in list format',
      'User can sort and refine results',
      'Clicking issue opens detail view',
      'Search can be saved for reuse'
    ],
    roles: {
      admin: ['Search all issues', 'Save global filters'],
      user: ['Search accessible issues', 'Save personal filters']
    },
    preconditions: ['Issue access permissions', 'Valid search criteria'],
    postconditions: ['Results returned', 'Search is logged', 'Saved filter stored'],
    edgeCases: ['Empty results handling', 'Large result set pagination', 'Complex query performance', 'Permission filtering'],
    associatedDiagrams: ['data-flow']
  },
  {
    id: 'statuses',
    name: 'Status Management',
    description: 'Issue status configuration',
    purpose: 'Define and manage issue statuses used across workflows.',
    components: ['StatusManager.tsx'],
    hooks: [],
    services: [],
    userFlow: [
      'Admin navigates to Status settings',
      'Views existing statuses',
      'Creates new status with name and category',
      'Assigns color and description',
      'Status is available for workflows',
      'Status appears on issues'
    ],
    roles: {
      admin: ['Create/edit statuses', 'Set status categories', 'Delete unused statuses'],
      user: ['Cannot manage statuses']
    },
    preconditions: ['Admin permission required', 'Unique status name'],
    postconditions: ['Status created', 'Available in workflow editor', 'Color is applied'],
    edgeCases: ['Status in use deletion prevention', 'Category change impact', 'Status migration'],
    associatedDiagrams: ['issue-lifecycle']
  },
  {
    id: 'versions',
    name: 'Versions & Releases',
    description: 'Version tracking and release management',
    purpose: 'Track software versions, plan releases, and associate issues with versions.',
    components: [],
    hooks: ['useVersions.ts'],
    services: [],
    userFlow: [
      'Admin creates version for project',
      'Sets version name and dates',
      'Issues are assigned to version',
      'Version progress is tracked',
      'Version is released',
      'Release notes can be generated'
    ],
    roles: {
      admin: ['Create/edit versions', 'Release versions', 'Archive versions'],
      user: ['View versions', 'Assign issues to versions']
    },
    preconditions: ['Project exists', 'Unique version name within project'],
    postconditions: ['Version created', 'Issues can be assigned', 'Progress is calculated'],
    edgeCases: ['Version date conflicts', 'Released version modification', 'Merge versions'],
    associatedDiagrams: ['core-erd']
  },
  {
    id: 'components',
    name: 'Components',
    description: 'Project component organization',
    purpose: 'Organize issues by logical components or areas of the system.',
    components: [],
    hooks: ['useComponents.ts'],
    services: [],
    userFlow: [
      'Admin creates component in project',
      'Assigns component lead and description',
      'Issues are tagged with components',
      'Component-based filtering and reporting',
      'Default assignee can be set per component'
    ],
    roles: {
      admin: ['Create/edit components', 'Assign component leads', 'Archive components'],
      user: ['View components', 'Assign issues to components']
    },
    preconditions: ['Project exists', 'Unique component name within project'],
    postconditions: ['Component created', 'Issues can be tagged', 'Lead is assigned'],
    edgeCases: ['Component deletion with issues', 'Lead user removal', 'Component merge'],
    associatedDiagrams: ['core-erd']
  }
];
