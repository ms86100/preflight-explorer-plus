import { DiagramData } from '../types';

// Module-specific diagrams: sequence diagrams and ERDs for each module
export const moduleDiagrams: Record<string, { sequence: DiagramData; erd: DiagramData }> = {
  projects: {
    sequence: {
      id: 'projects-sequence',
      title: 'Project Creation Flow',
      type: 'sequence',
      description: 'Sequence diagram showing the project creation process',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Project Form
    participant API as API Layer
    participant DB as Database
    
    U->>UI: Click "Create Project"
    UI->>UI: Display project form
    U->>UI: Enter project details
    UI->>UI: Validate inputs
    UI->>API: POST /projects
    API->>API: Generate project key
    API->>DB: Insert project record
    DB->>DB: Create default board
    DB->>DB: Create default statuses
    DB-->>API: Project created
    API-->>UI: Return project data
    UI-->>U: Redirect to project board`
    },
    erd: {
      id: 'projects-erd',
      title: 'Projects Entity Relationships',
      type: 'erd',
      description: 'Entity relationship diagram for the Projects module',
      mermaidCode: `erDiagram
    PROJECTS {
        uuid id PK
        string name
        string key UK
        string description
        uuid lead_id FK
        timestamp created_at
    }
    BOARDS {
        uuid id PK
        uuid project_id FK
        string name
        string board_type
    }
    ISSUES {
        uuid id PK
        uuid project_id FK
        string issue_key
    }
    COMPONENTS {
        uuid id PK
        uuid project_id FK
        string name
    }
    VERSIONS {
        uuid id PK
        uuid project_id FK
        string name
    }
    
    PROJECTS ||--o{ BOARDS : has
    PROJECTS ||--o{ ISSUES : contains
    PROJECTS ||--o{ COMPONENTS : organizes
    PROJECTS ||--o{ VERSIONS : tracks`
    }
  },
  issues: {
    sequence: {
      id: 'issues-sequence',
      title: 'Issue Lifecycle Flow',
      type: 'sequence',
      description: 'Sequence diagram showing issue creation and transitions',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Issue Form
    participant WF as Workflow Engine
    participant DB as Database
    participant N as Notifications
    
    U->>UI: Create new issue
    UI->>UI: Validate required fields
    UI->>DB: Generate issue key
    DB-->>UI: PROJ-123
    UI->>DB: Insert issue record
    DB->>DB: Log to issue_history
    DB-->>UI: Issue created
    
    Note over U,N: Status Transition
    U->>UI: Drag to "In Progress"
    UI->>WF: Validate transition
    WF->>WF: Check conditions
    WF-->>UI: Transition allowed
    UI->>DB: Update status
    DB->>DB: Log change
    DB->>N: Trigger notifications
    N-->>U: Notify watchers`
    },
    erd: {
      id: 'issues-erd',
      title: 'Issues Entity Relationships',
      type: 'erd',
      description: 'Entity relationship diagram for the Issues module',
      mermaidCode: `erDiagram
    ISSUES {
        uuid id PK
        uuid project_id FK
        uuid status_id FK
        uuid assignee_id FK
        uuid reporter_id FK
        string issue_key UK
        string summary
        text description
        integer story_points
    }
    ISSUE_HISTORY {
        uuid id PK
        uuid issue_id FK
        string field_name
        string old_value
        string new_value
        timestamp changed_at
    }
    COMMENTS {
        uuid id PK
        uuid issue_id FK
        uuid author_id FK
        text body
    }
    ATTACHMENTS {
        uuid id PK
        uuid issue_id FK
        string filename
        string file_path
    }
    ISSUE_LABELS {
        uuid id PK
        uuid issue_id FK
        uuid label_id FK
    }
    
    ISSUES ||--o{ ISSUE_HISTORY : tracks
    ISSUES ||--o{ COMMENTS : has
    ISSUES ||--o{ ATTACHMENTS : contains
    ISSUES ||--o{ ISSUE_LABELS : tagged`
    }
  },
  boards: {
    sequence: {
      id: 'boards-sequence',
      title: 'Board Drag-Drop Flow',
      type: 'sequence',
      description: 'Sequence diagram showing board interactions',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant B as Board UI
    participant V as Validator
    participant DB as Database
    participant RT as Realtime
    
    U->>B: Drag issue card
    B->>B: Show drop zones
    U->>B: Drop on column
    B->>V: Check WIP limits
    V->>V: Validate workflow
    
    alt Valid Move
        V-->>B: Allowed
        B->>B: Optimistic update
        B->>DB: Update issue status
        DB->>RT: Broadcast change
        RT-->>B: Sync all clients
    else Invalid Move
        V-->>B: Blocked
        B->>B: Revert position
        B-->>U: Show error
    end`
    },
    erd: {
      id: 'boards-erd',
      title: 'Boards Entity Relationships',
      type: 'erd',
      description: 'Entity relationship diagram for the Boards module',
      mermaidCode: `erDiagram
    BOARDS {
        uuid id PK
        uuid project_id FK
        string name
        string board_type
        string filter_jql
        boolean is_private
    }
    BOARD_COLUMNS {
        uuid id PK
        uuid board_id FK
        string name
        integer position
        integer max_issues
        integer min_issues
    }
    BOARD_COLUMN_STATUSES {
        uuid id PK
        uuid column_id FK
        uuid status_id FK
    }
    ISSUE_STATUSES {
        uuid id PK
        string name
        string category
        string color
    }
    
    BOARDS ||--o{ BOARD_COLUMNS : contains
    BOARD_COLUMNS ||--o{ BOARD_COLUMN_STATUSES : maps
    ISSUE_STATUSES ||--o{ BOARD_COLUMN_STATUSES : assigned`
    }
  },
  backlog: {
    sequence: {
      id: 'backlog-sequence',
      title: 'Sprint Planning Flow',
      type: 'sequence',
      description: 'Sequence diagram showing sprint planning process',
      mermaidCode: `sequenceDiagram
    participant PM as Product Manager
    participant UI as Backlog View
    participant API as API
    participant DB as Database
    
    PM->>UI: View backlog
    UI->>API: GET /backlog/issues
    API->>DB: Query ordered issues
    DB-->>UI: Return issues
    
    PM->>UI: Create sprint
    UI->>API: POST /sprints
    API->>DB: Insert sprint
    DB-->>UI: Sprint created
    
    PM->>UI: Drag issues to sprint
    UI->>API: PATCH /issues (sprint_id)
    API->>DB: Update issues
    
    PM->>UI: Start sprint
    UI->>API: PUT /sprints/:id/start
    API->>DB: Set start_date
    API->>DB: Calculate velocity
    DB-->>UI: Sprint active`
    },
    erd: {
      id: 'backlog-erd',
      title: 'Backlog & Sprints ERD',
      type: 'erd',
      description: 'Entity relationship diagram for backlog and sprint management',
      mermaidCode: `erDiagram
    SPRINTS {
        uuid id PK
        uuid project_id FK
        string name
        string goal
        date start_date
        date end_date
        string status
    }
    ISSUES {
        uuid id PK
        uuid sprint_id FK
        string lexorank
        integer story_points
    }
    SPRINT_HISTORY {
        uuid id PK
        uuid sprint_id FK
        date snapshot_date
        integer total_points
        integer completed_points
    }
    
    SPRINTS ||--o{ ISSUES : contains
    SPRINTS ||--o{ SPRINT_HISTORY : tracks`
    }
  },
  workflows: {
    sequence: {
      id: 'workflows-sequence',
      title: 'Workflow Execution Flow',
      type: 'sequence',
      description: 'Sequence diagram showing workflow transition execution',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Issue View
    participant WE as Workflow Engine
    participant DB as Database
    
    U->>UI: Request transition
    UI->>WE: Validate transition
    WE->>DB: Load workflow
    WE->>WE: Check conditions
    WE->>WE: Run validators
    
    alt Validation Passed
        WE->>WE: Execute post-functions
        WE->>DB: Update issue status
        WE->>DB: Log transition
        WE-->>UI: Transition complete
    else Validation Failed
        WE-->>UI: Return errors
        UI-->>U: Show requirements
    end`
    },
    erd: {
      id: 'workflows-erd',
      title: 'Workflows Entity Relationships',
      type: 'erd',
      description: 'Entity relationship diagram for workflow configuration',
      mermaidCode: `erDiagram
    WORKFLOWS {
        uuid id PK
        string name
        string description
        boolean is_active
    }
    WORKFLOW_STATUSES {
        uuid id PK
        uuid workflow_id FK
        uuid status_id FK
        boolean is_initial
    }
    WORKFLOW_TRANSITIONS {
        uuid id PK
        uuid workflow_id FK
        uuid from_status_id FK
        uuid to_status_id FK
        string name
    }
    TRANSITION_CONDITIONS {
        uuid id PK
        uuid transition_id FK
        string condition_type
        json config
    }
    WORKFLOW_SCHEMES {
        uuid id PK
        uuid project_id FK
        uuid workflow_id FK
        uuid issue_type_id FK
    }
    
    WORKFLOWS ||--o{ WORKFLOW_STATUSES : defines
    WORKFLOWS ||--o{ WORKFLOW_TRANSITIONS : has
    WORKFLOW_TRANSITIONS ||--o{ TRANSITION_CONDITIONS : validates
    WORKFLOWS ||--o{ WORKFLOW_SCHEMES : assigned`
    }
  },
  'git-integration': {
    sequence: {
      id: 'git-sequence',
      title: 'Git Webhook Processing',
      type: 'sequence',
      description: 'Sequence diagram showing Git event processing',
      mermaidCode: `sequenceDiagram
    participant Git as Git Provider
    participant WH as Webhook Handler
    participant Parser as Smart Commit Parser
    participant DB as Database
    participant Issue as Issue Service
    
    Git->>WH: POST /webhook (push event)
    WH->>WH: Verify signature
    WH->>Parser: Parse commits
    
    loop Each Commit
        Parser->>Parser: Extract issue keys
        Parser->>Parser: Parse smart commands
        Parser->>DB: Store commit
        Parser->>Issue: Link to issues
        
        alt Has Smart Commands
            Parser->>Issue: Execute #transition
            Parser->>Issue: Execute #comment
            Parser->>Issue: Execute #time
        end
    end
    
    WH-->>Git: 200 OK`
    },
    erd: {
      id: 'git-erd',
      title: 'Git Integration ERD',
      type: 'erd',
      description: 'Entity relationship diagram for Git integration',
      mermaidCode: `erDiagram
    GIT_ORGANIZATIONS {
        uuid id PK
        string name
        string provider_type
        string host_url
    }
    GIT_REPOSITORIES {
        uuid id PK
        uuid organization_id FK
        uuid project_id FK
        string name
        string slug
    }
    GIT_COMMITS {
        uuid id PK
        uuid repository_id FK
        string commit_hash UK
        string message
        string author_email
    }
    GIT_COMMIT_ISSUES {
        uuid id PK
        uuid commit_id FK
        uuid issue_id FK
        string issue_key
    }
    GIT_PULL_REQUESTS {
        uuid id PK
        uuid repository_id FK
        string title
        string status
    }
    
    GIT_ORGANIZATIONS ||--o{ GIT_REPOSITORIES : contains
    GIT_REPOSITORIES ||--o{ GIT_COMMITS : has
    GIT_COMMITS ||--o{ GIT_COMMIT_ISSUES : links
    GIT_REPOSITORIES ||--o{ GIT_PULL_REQUESTS : has`
    }
  },
  reports: {
    sequence: {
      id: 'reports-sequence',
      title: 'Report Generation Flow',
      type: 'sequence',
      description: 'Sequence diagram showing report data aggregation',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Report View
    participant API as API
    participant DB as Database
    participant Cache as Cache
    
    U->>UI: Select report type
    U->>UI: Set date range
    UI->>API: GET /reports/:type
    API->>Cache: Check cached data
    
    alt Cache Hit
        Cache-->>API: Return cached
    else Cache Miss
        API->>DB: Aggregate data
        DB-->>API: Raw metrics
        API->>API: Calculate stats
        API->>Cache: Store result
    end
    
    API-->>UI: Report data
    UI->>UI: Render charts
    UI-->>U: Display report`
    },
    erd: {
      id: 'reports-erd',
      title: 'Reports Data Sources ERD',
      type: 'erd',
      description: 'Entity relationships used for report generation',
      mermaidCode: `erDiagram
    ISSUES {
        uuid id PK
        uuid status_id FK
        uuid assignee_id FK
        integer story_points
        timestamp created_at
        timestamp resolved_at
    }
    ISSUE_HISTORY {
        uuid id PK
        uuid issue_id FK
        string field_name
        timestamp changed_at
    }
    SPRINTS {
        uuid id PK
        date start_date
        date end_date
        string status
    }
    TIME_TRACKING {
        uuid id PK
        uuid issue_id FK
        integer time_spent
        date work_date
    }
    
    ISSUES ||--o{ ISSUE_HISTORY : tracks
    ISSUES ||--o{ TIME_TRACKING : logs
    SPRINTS ||--o{ ISSUES : contains`
    }
  },
  'custom-fields': {
    sequence: {
      id: 'custom-fields-sequence',
      title: 'Custom Field Configuration',
      type: 'sequence',
      description: 'Sequence diagram showing custom field setup',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Field Manager
    participant API as API
    participant DB as Database
    
    A->>UI: Create custom field
    UI->>UI: Select field type
    A->>UI: Configure options
    UI->>API: POST /custom-fields
    API->>DB: Insert field definition
    
    A->>UI: Assign to context
    UI->>API: POST /custom-fields/:id/contexts
    API->>DB: Link to project/issue type
    
    Note over A,DB: Field now appears on forms
    
    A->>UI: Open issue form
    UI->>API: GET /custom-fields (for context)
    API->>DB: Query fields for context
    DB-->>UI: Return field definitions
    UI->>UI: Render custom inputs`
    },
    erd: {
      id: 'custom-fields-erd',
      title: 'Custom Fields ERD',
      type: 'erd',
      description: 'Entity relationship diagram for custom fields',
      mermaidCode: `erDiagram
    CUSTOM_FIELD_DEFINITIONS {
        uuid id PK
        string name
        string field_type
        json options
        json validation_rules
        boolean is_required
    }
    CUSTOM_FIELD_CONTEXTS {
        uuid id PK
        uuid field_id FK
        uuid project_id FK
        uuid issue_type_id FK
        string default_value
    }
    CUSTOM_FIELD_VALUES {
        uuid id PK
        uuid field_id FK
        uuid issue_id FK
        string value_text
        numeric value_number
        date value_date
    }
    
    CUSTOM_FIELD_DEFINITIONS ||--o{ CUSTOM_FIELD_CONTEXTS : scoped
    CUSTOM_FIELD_DEFINITIONS ||--o{ CUSTOM_FIELD_VALUES : stores`
    }
  },
  teams: {
    sequence: {
      id: 'teams-sequence',
      title: 'Team Management Flow',
      type: 'sequence',
      description: 'Sequence diagram showing team operations',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Team Manager
    participant API as API
    participant DB as Database
    
    A->>UI: Create team
    UI->>API: POST /teams
    API->>DB: Insert team
    DB-->>UI: Team created
    
    A->>UI: Add members
    UI->>API: PUT /teams/:id/members
    API->>DB: Insert memberships
    
    A->>UI: Assign team lead
    UI->>API: PATCH /teams/:id
    API->>DB: Update lead_id
    
    Note over A,DB: Team can now be assigned
    
    A->>UI: Assign to issue
    UI->>API: PATCH /issues/:id
    API->>DB: Set team_id
    DB-->>UI: Issue updated`
    },
    erd: {
      id: 'teams-erd',
      title: 'Teams Entity Relationships',
      type: 'erd',
      description: 'Entity relationship diagram for team management',
      mermaidCode: `erDiagram
    TEAMS {
        uuid id PK
        string name
        string description
        uuid lead_id FK
        boolean is_active
    }
    TEAM_MEMBERS {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        string role
    }
    PROFILES {
        uuid id PK
        string display_name
        string email
    }
    ISSUES {
        uuid id PK
        uuid team_id FK
    }
    
    TEAMS ||--o{ TEAM_MEMBERS : has
    PROFILES ||--o{ TEAM_MEMBERS : belongs
    TEAMS ||--o{ ISSUES : assigned`
    }
  },
  notifications: {
    sequence: {
      id: 'notifications-sequence',
      title: 'Notification Delivery Flow',
      type: 'sequence',
      description: 'Sequence diagram showing notification processing',
      mermaidCode: `sequenceDiagram
    participant Trigger as Event Trigger
    participant NS as Notification Service
    participant DB as Database
    participant RT as Realtime
    participant U as User
    
    Trigger->>NS: Issue assigned
    NS->>DB: Get user preferences
    DB-->>NS: Preferences
    
    NS->>NS: Check if enabled
    NS->>DB: Create notification
    DB->>RT: Broadcast to channel
    RT-->>U: Real-time update
    
    U->>U: See bell indicator
    U->>NS: Click notification
    NS->>DB: Mark as read
    NS-->>U: Navigate to issue`
    },
    erd: {
      id: 'notifications-erd',
      title: 'Notifications ERD',
      type: 'erd',
      description: 'Entity relationship diagram for notifications',
      mermaidCode: `erDiagram
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string type
        string title
        string message
        uuid entity_id
        boolean is_read
        timestamp created_at
    }
    NOTIFICATION_PREFERENCES {
        uuid id PK
        uuid user_id FK
        string notification_type
        boolean email_enabled
        boolean push_enabled
    }
    PROFILES {
        uuid id PK
        string email
    }
    
    PROFILES ||--o{ NOTIFICATIONS : receives
    PROFILES ||--o{ NOTIFICATION_PREFERENCES : configures`
    }
  },
  comments: {
    sequence: {
      id: 'comments-sequence',
      title: 'Comment with Mentions Flow',
      type: 'sequence',
      description: 'Sequence diagram showing comment creation with mentions',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Comment Editor
    participant API as API
    participant DB as Database
    participant N as Notifications
    
    U->>UI: Type comment
    U->>UI: Type @username
    UI->>API: GET /users/search
    API-->>UI: Matching users
    UI->>UI: Show autocomplete
    U->>UI: Select user
    U->>UI: Submit comment
    
    UI->>API: POST /comments
    API->>DB: Insert comment
    API->>API: Extract mentions
    API->>DB: Create mention records
    API->>N: Notify mentioned users
    N-->>N: Send notifications
    DB-->>UI: Comment saved`
    },
    erd: {
      id: 'comments-erd',
      title: 'Comments Entity Relationships',
      type: 'erd',
      description: 'Entity relationship diagram for comments and mentions',
      mermaidCode: `erDiagram
    COMMENTS {
        uuid id PK
        uuid issue_id FK
        uuid author_id FK
        text body
        timestamp created_at
        timestamp updated_at
    }
    COMMENT_MENTIONS {
        uuid id PK
        uuid comment_id FK
        uuid mentioned_user_id FK
    }
    PROFILES {
        uuid id PK
        string display_name
    }
    ISSUES {
        uuid id PK
        string issue_key
    }
    
    ISSUES ||--o{ COMMENTS : has
    PROFILES ||--o{ COMMENTS : authors
    COMMENTS ||--o{ COMMENT_MENTIONS : contains
    PROFILES ||--o{ COMMENT_MENTIONS : mentioned`
    }
  },
  migration: {
    sequence: {
      id: 'migration-sequence',
      title: 'Data Import Flow',
      type: 'sequence',
      description: 'Sequence diagram showing CSV import process',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Import Wizard
    participant API as Edge Function
    participant V as Validator
    participant DB as Database
    
    A->>UI: Upload CSV file
    UI->>API: POST /import/upload
    API->>API: Parse CSV
    API->>V: Validate rows
    V-->>API: Validation results
    API-->>UI: Preview with errors
    
    A->>UI: Map fields
    A->>UI: Start import
    UI->>API: POST /import/execute
    
    loop Each Row
        API->>V: Validate row
        API->>DB: Insert/Update record
        API->>UI: Progress update
    end
    
    API-->>UI: Import complete
    UI-->>A: Show summary`
    },
    erd: {
      id: 'migration-erd',
      title: 'Data Migration ERD',
      type: 'erd',
      description: 'Entity relationship diagram for import/export tracking',
      mermaidCode: `erDiagram
    IMPORT_JOBS {
        uuid id PK
        uuid user_id FK
        string import_type
        string source_format
        string status
        integer total_records
        integer successful_records
        integer failed_records
    }
    IMPORT_ERRORS {
        uuid id PK
        uuid job_id FK
        integer row_number
        string field_name
        string error_type
        string error_message
    }
    IMPORT_MAPPINGS {
        uuid id PK
        uuid user_id FK
        string import_type
        string name
        json mappings
        boolean is_default
    }
    
    IMPORT_JOBS ||--o{ IMPORT_ERRORS : logs
    IMPORT_MAPPINGS ||--o{ IMPORT_JOBS : uses`
    }
  },
  plugins: {
    sequence: {
      id: 'plugins-sequence',
      title: 'Plugin Enable/Disable Flow',
      type: 'sequence',
      description: 'Sequence diagram showing plugin management',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Plugin Manager
    participant API as API
    participant DB as Database
    participant App as Application
    
    A->>UI: View plugins
    UI->>API: GET /plugins
    API->>DB: List plugins
    DB-->>UI: Plugin list
    
    A->>UI: Enable plugin
    UI->>API: PUT /plugins/:id/enable
    API->>API: Check dependencies
    API->>DB: Update is_enabled
    API->>App: Refresh feature flags
    App-->>UI: Plugin active
    
    Note over A,App: Features now available
    
    A->>UI: Access feature
    UI->>App: Check FeatureGate
    App-->>UI: Render if enabled`
    },
    erd: {
      id: 'plugins-erd',
      title: 'Plugins Entity Relationships',
      type: 'erd',
      description: 'Entity relationship diagram for plugin system',
      mermaidCode: `erDiagram
    PLUGINS {
        uuid id PK
        string name
        string version
        string description
        boolean is_enabled
        json settings
    }
    PLUGIN_FEATURES {
        uuid id PK
        uuid plugin_id FK
        string feature_key
        boolean is_active
    }
    PLUGIN_DEPENDENCIES {
        uuid id PK
        uuid plugin_id FK
        uuid requires_plugin_id FK
    }
    
    PLUGINS ||--o{ PLUGIN_FEATURES : provides
    PLUGINS ||--o{ PLUGIN_DEPENDENCIES : requires`
    }
  },
  ldap: {
    sequence: {
      id: 'ldap-sequence',
      title: 'LDAP Sync Flow',
      type: 'sequence',
      description: 'Sequence diagram showing LDAP synchronization',
      mermaidCode: `sequenceDiagram
    participant Scheduler as Scheduler
    participant Edge as Edge Function
    participant LDAP as LDAP Server
    participant DB as Database
    
    Scheduler->>Edge: Trigger sync
    Edge->>DB: Get LDAP config
    DB-->>Edge: Connection details
    
    Edge->>LDAP: Bind with credentials
    LDAP-->>Edge: Bind successful
    
    Edge->>LDAP: Search users
    LDAP-->>Edge: User entries
    
    loop Each User
        Edge->>DB: Find or create user
        Edge->>DB: Update attributes
    end
    
    Edge->>LDAP: Search groups
    LDAP-->>Edge: Group entries
    Edge->>DB: Update group mappings
    
    Edge->>DB: Update sync status
    Edge-->>Scheduler: Sync complete`
    },
    erd: {
      id: 'ldap-erd',
      title: 'LDAP Integration ERD',
      type: 'erd',
      description: 'Entity relationship diagram for LDAP configuration',
      mermaidCode: `erDiagram
    LDAP_CONFIGURATIONS {
        uuid id PK
        string name
        string server_url
        integer port
        string bind_dn
        string base_dn
        string search_filter
        boolean is_active
    }
    LDAP_GROUP_MAPPINGS {
        uuid id PK
        uuid config_id FK
        string ldap_group_dn
        uuid group_id FK
    }
    GROUPS {
        uuid id PK
        string name
    }
    PROFILES {
        uuid id PK
        string ldap_dn
        boolean is_ldap_user
    }
    
    LDAP_CONFIGURATIONS ||--o{ LDAP_GROUP_MAPPINGS : defines
    GROUPS ||--o{ LDAP_GROUP_MAPPINGS : maps
    LDAP_CONFIGURATIONS ||--o{ PROFILES : syncs`
    }
  },
  enterprise: {
    sequence: {
      id: 'enterprise-sequence',
      title: 'Audit Log Query Flow',
      type: 'sequence',
      description: 'Sequence diagram showing audit log access',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Audit Viewer
    participant API as API
    participant DB as Database
    
    A->>UI: Open audit logs
    UI->>API: GET /audit-logs
    API->>API: Check admin permission
    API->>DB: Query with filters
    DB-->>API: Log entries
    API-->>UI: Paginated results
    
    A->>UI: Apply filter
    UI->>API: GET /audit-logs?filters
    API->>DB: Filtered query
    DB-->>UI: Filtered results
    
    A->>UI: Export logs
    UI->>API: GET /audit-logs/export
    API->>DB: Full query
    API-->>UI: CSV download`
    },
    erd: {
      id: 'enterprise-erd',
      title: 'Enterprise Features ERD',
      type: 'erd',
      description: 'Entity relationship diagram for enterprise features',
      mermaidCode: `erDiagram
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string entity_type
        uuid entity_id
        string action
        json old_values
        json new_values
        timestamp created_at
    }
    PERMISSION_SCHEMES {
        uuid id PK
        string name
        json permissions
    }
    PROJECT_PERMISSIONS {
        uuid id PK
        uuid project_id FK
        uuid scheme_id FK
    }
    PROFILES {
        uuid id PK
        string role
    }
    
    PROFILES ||--o{ AUDIT_LOGS : performs
    PERMISSION_SCHEMES ||--o{ PROJECT_PERMISSIONS : assigned`
    }
  },
  compliance: {
    sequence: {
      id: 'compliance-sequence',
      title: 'Data Classification Flow',
      type: 'sequence',
      description: 'Sequence diagram showing classification enforcement',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Issue View
    participant API as API
    participant Policy as Policy Engine
    participant DB as Database
    
    U->>UI: Set classification
    UI->>API: PUT /issues/:id/classification
    API->>Policy: Validate permission
    Policy-->>API: Allowed
    API->>DB: Update classification
    DB-->>UI: Classification set
    
    Note over U,DB: Export Request
    U->>UI: Request export
    UI->>API: POST /compliance/export-request
    API->>Policy: Check classification
    
    alt Requires Approval
        Policy-->>API: Needs approval
        API->>DB: Create pending request
        API-->>UI: Awaiting approval
    else Auto-approved
        Policy-->>API: Approved
        API->>DB: Generate export
        API-->>UI: Download ready
    end`
    },
    erd: {
      id: 'compliance-erd',
      title: 'Compliance ERD',
      type: 'erd',
      description: 'Entity relationship diagram for compliance features',
      mermaidCode: `erDiagram
    ISSUES {
        uuid id PK
        string classification
    }
    ATTACHMENTS {
        uuid id PK
        uuid issue_id FK
        string classification
    }
    EXPORT_AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        uuid approver_id FK
        string export_type
        string classification_level
        string status
        timestamp approved_at
    }
    CLASSIFICATION_LEVELS {
        uuid id PK
        string name
        string color
        integer level
        boolean requires_approval
    }
    
    ISSUES ||--o{ ATTACHMENTS : contains
    CLASSIFICATION_LEVELS ||--o{ ISSUES : classifies
    CLASSIFICATION_LEVELS ||--o{ EXPORT_AUDIT_LOGS : governs`
    }
  },
  'document-composer': {
    sequence: {
      id: 'document-composer-sequence',
      title: 'Document Generation Flow',
      type: 'sequence',
      description: 'Sequence diagram showing document generation',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Export Wizard
    participant API as API
    participant Gen as Generator
    participant Storage as Storage
    
    U->>UI: Select issues
    U->>UI: Choose template
    UI->>API: POST /documents/generate
    API->>Gen: Start generation
    
    Gen->>Gen: Load template
    Gen->>Gen: Fetch issue data
    Gen->>Gen: Apply template vars
    Gen->>Gen: Render sections
    Gen->>Gen: Add watermarks
    Gen->>Gen: Generate PDF
    
    Gen->>Storage: Save document
    Gen->>API: Job complete
    API-->>UI: Download ready
    U->>UI: Download document`
    },
    erd: {
      id: 'document-composer-erd',
      title: 'Document Composer ERD',
      type: 'erd',
      description: 'Entity relationship diagram for document generation',
      mermaidCode: `erDiagram
    DOCUMENT_TEMPLATES {
        uuid id PK
        uuid created_by FK
        string name
        string format
        json header_config
        json footer_config
        json sections
        json styling
    }
    DOCUMENT_EXPORTS {
        uuid id PK
        uuid template_id FK
        uuid created_by FK
        string name
        string status
        string file_path
        integer file_size
        json issue_ids
    }
    
    DOCUMENT_TEMPLATES ||--o{ DOCUMENT_EXPORTS : generates`
    }
  },
  'structured-data': {
    sequence: {
      id: 'structured-data-sequence',
      title: 'Data Block Creation Flow',
      type: 'sequence',
      description: 'Sequence diagram showing structured data block usage',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Schema Editor
    participant API as API
    participant DB as Database
    participant U as User
    
    A->>UI: Create schema
    A->>UI: Define columns
    UI->>API: POST /data-schemas
    API->>DB: Insert schema
    DB-->>UI: Schema created
    
    Note over A,U: User adds data
    U->>UI: Open issue
    UI->>API: GET /data-schemas
    API-->>UI: Available schemas
    
    U->>UI: Add data block
    U->>UI: Enter matrix data
    UI->>API: POST /data-blocks
    API->>API: Validate against schema
    API->>DB: Insert data block
    DB-->>UI: Data saved`
    },
    erd: {
      id: 'structured-data-erd',
      title: 'Structured Data ERD',
      type: 'erd',
      description: 'Entity relationship diagram for structured data blocks',
      mermaidCode: `erDiagram
    DATA_BLOCK_SCHEMAS {
        uuid id PK
        uuid created_by FK
        string name
        string description
        json columns
        json validation_rules
        integer version
    }
    DATA_BLOCK_INSTANCES {
        uuid id PK
        uuid schema_id FK
        uuid issue_id FK
        uuid project_id FK
        string name
        json rows
    }
    ISSUES {
        uuid id PK
    }
    
    DATA_BLOCK_SCHEMAS ||--o{ DATA_BLOCK_INSTANCES : instantiates
    ISSUES ||--o{ DATA_BLOCK_INSTANCES : contains`
    }
  },
  'guided-operations': {
    sequence: {
      id: 'guided-operations-sequence',
      title: 'Operation Execution Flow',
      type: 'sequence',
      description: 'Sequence diagram showing guided operation execution',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Operation Wizard
    participant API as API
    participant DB as Database
    
    U->>UI: Start operation
    UI->>API: POST /operations/:id/start
    API->>DB: Create execution record
    DB-->>UI: Execution ID
    
    loop Each Step
        UI-->>U: Show step form
        U->>UI: Complete step
        UI->>API: POST /executions/:id/step
        API->>API: Validate step
        API->>DB: Save step data
        API-->>UI: Step complete
    end
    
    UI->>API: Confirm execution
    API->>API: Execute actions
    API->>DB: Update status
    API-->>UI: Operation complete`
    },
    erd: {
      id: 'guided-operations-erd',
      title: 'Guided Operations ERD',
      type: 'erd',
      description: 'Entity relationship diagram for guided operations',
      mermaidCode: `erDiagram
    GUIDED_OPERATIONS {
        uuid id PK
        uuid created_by FK
        string name
        string description
        string category
        json steps
        boolean requires_approval
    }
    GUIDED_OPERATION_EXECUTIONS {
        uuid id PK
        uuid operation_id FK
        uuid started_by FK
        string status
        integer current_step
        json step_data
        json result
    }
    
    GUIDED_OPERATIONS ||--o{ GUIDED_OPERATION_EXECUTIONS : executes`
    }
  },
  search: {
    sequence: {
      id: 'search-sequence',
      title: 'Issue Search Flow',
      type: 'sequence',
      description: 'Sequence diagram showing search functionality',
      mermaidCode: `sequenceDiagram
    participant U as User
    participant UI as Search View
    participant API as API
    participant DB as Database
    participant Cache as Cache
    
    U->>UI: Enter search query
    UI->>UI: Debounce input
    UI->>API: GET /search/issues
    API->>Cache: Check cached results
    
    alt Cache Miss
        API->>DB: Full-text search
        DB->>DB: Apply RLS filters
        DB-->>API: Results
        API->>Cache: Store results
    end
    
    API-->>UI: Search results
    UI->>UI: Render results
    
    U->>UI: Save filter
    UI->>API: POST /search/filters
    API->>DB: Insert saved filter
    DB-->>UI: Filter saved`
    },
    erd: {
      id: 'search-erd',
      title: 'Search ERD',
      type: 'erd',
      description: 'Entity relationship diagram for search features',
      mermaidCode: `erDiagram
    SAVED_FILTERS {
        uuid id PK
        uuid user_id FK
        string name
        string query
        boolean is_global
    }
    ISSUES {
        uuid id PK
        string summary
        text description
        tsvector search_vector
    }
    PROFILES {
        uuid id PK
    }
    
    PROFILES ||--o{ SAVED_FILTERS : owns
    SAVED_FILTERS ||--o{ ISSUES : queries`
    }
  },
  statuses: {
    sequence: {
      id: 'statuses-sequence',
      title: 'Status Configuration Flow',
      type: 'sequence',
      description: 'Sequence diagram showing status management',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Status Manager
    participant API as API
    participant DB as Database
    
    A->>UI: Create status
    UI->>API: POST /statuses
    API->>DB: Check unique name
    API->>DB: Insert status
    DB-->>UI: Status created
    
    A->>UI: Update color
    UI->>API: PUT /statuses/:id
    API->>DB: Update record
    DB-->>UI: Status updated
    
    A->>UI: Delete status
    UI->>API: DELETE /statuses/:id
    API->>DB: Check usage
    
    alt Status in use
        API-->>UI: Cannot delete
    else Status unused
        API->>DB: Delete status
        DB-->>UI: Status deleted
    end`
    },
    erd: {
      id: 'statuses-erd',
      title: 'Statuses ERD',
      type: 'erd',
      description: 'Entity relationship diagram for status management',
      mermaidCode: `erDiagram
    ISSUE_STATUSES {
        uuid id PK
        string name
        string category
        string color
        string description
        integer position
    }
    ISSUES {
        uuid id PK
        uuid status_id FK
    }
    WORKFLOW_STATUSES {
        uuid id PK
        uuid status_id FK
        uuid workflow_id FK
    }
    BOARD_COLUMN_STATUSES {
        uuid id PK
        uuid status_id FK
        uuid column_id FK
    }
    
    ISSUE_STATUSES ||--o{ ISSUES : categorizes
    ISSUE_STATUSES ||--o{ WORKFLOW_STATUSES : used_in
    ISSUE_STATUSES ||--o{ BOARD_COLUMN_STATUSES : mapped`
    }
  },
  versions: {
    sequence: {
      id: 'versions-sequence',
      title: 'Version Release Flow',
      type: 'sequence',
      description: 'Sequence diagram showing version management',
      mermaidCode: `sequenceDiagram
    participant PM as Product Manager
    participant UI as Version View
    participant API as API
    participant DB as Database
    
    PM->>UI: Create version
    UI->>API: POST /versions
    API->>DB: Insert version
    DB-->>UI: Version created
    
    Note over PM,DB: Issues assigned
    
    PM->>UI: Release version
    UI->>API: PUT /versions/:id/release
    API->>DB: Set released_at
    API->>DB: Calculate metrics
    
    PM->>UI: Generate notes
    UI->>API: GET /versions/:id/release-notes
    API->>DB: Query linked issues
    API->>API: Format markdown
    API-->>UI: Release notes`
    },
    erd: {
      id: 'versions-erd',
      title: 'Versions ERD',
      type: 'erd',
      description: 'Entity relationship diagram for version tracking',
      mermaidCode: `erDiagram
    VERSIONS {
        uuid id PK
        uuid project_id FK
        string name
        string description
        date start_date
        date release_date
        boolean is_released
        boolean is_archived
    }
    ISSUE_FIX_VERSIONS {
        uuid id PK
        uuid issue_id FK
        uuid version_id FK
    }
    ISSUE_AFFECTS_VERSIONS {
        uuid id PK
        uuid issue_id FK
        uuid version_id FK
    }
    ISSUES {
        uuid id PK
    }
    
    VERSIONS ||--o{ ISSUE_FIX_VERSIONS : fixes
    VERSIONS ||--o{ ISSUE_AFFECTS_VERSIONS : affects
    ISSUES ||--o{ ISSUE_FIX_VERSIONS : targeted
    ISSUES ||--o{ ISSUE_AFFECTS_VERSIONS : impacted`
    }
  },
  components: {
    sequence: {
      id: 'components-sequence',
      title: 'Component Assignment Flow',
      type: 'sequence',
      description: 'Sequence diagram showing component operations',
      mermaidCode: `sequenceDiagram
    participant A as Admin
    participant UI as Component Manager
    participant API as API
    participant DB as Database
    
    A->>UI: Create component
    UI->>API: POST /components
    API->>DB: Insert component
    DB-->>UI: Component created
    
    A->>UI: Set default assignee
    UI->>API: PUT /components/:id
    API->>DB: Update assignee type
    
    Note over A,DB: Issue creation
    A->>UI: Create issue
    A->>UI: Select component
    UI->>API: POST /issues
    API->>API: Check default assignee
    API->>DB: Auto-assign if configured
    DB-->>UI: Issue created`
    },
    erd: {
      id: 'components-erd',
      title: 'Components ERD',
      type: 'erd',
      description: 'Entity relationship diagram for project components',
      mermaidCode: `erDiagram
    COMPONENTS {
        uuid id PK
        uuid project_id FK
        uuid lead_id FK
        string name
        string description
        string default_assignee_type
        boolean is_archived
    }
    ISSUE_COMPONENTS {
        uuid id PK
        uuid issue_id FK
        uuid component_id FK
    }
    ISSUES {
        uuid id PK
    }
    PROFILES {
        uuid id PK
        string display_name
    }
    
    COMPONENTS ||--o{ ISSUE_COMPONENTS : tags
    ISSUES ||--o{ ISSUE_COMPONENTS : categorized
    PROFILES ||--o{ COMPONENTS : leads`
    }
  }
};
