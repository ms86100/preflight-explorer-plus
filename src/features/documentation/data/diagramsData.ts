import { DiagramData } from '../types';

export const diagramsData: DiagramData[] = [
  {
    id: 'system-architecture',
    title: 'System Architecture',
    type: 'architecture',
    description: 'High-level overview of the Vertex PM system architecture showing frontend, backend, and external integrations.',
    mermaidCode: `graph TB
    subgraph Client[Frontend - React TypeScript]
        UI[UI Components]
        Features[Feature Modules]
        State[TanStack Query]
        Router[React Router]
    end
    
    subgraph Backend[Backend - Supabase]
        Auth[Authentication]
        DB[(PostgreSQL)]
        Edge[Edge Functions]
        Storage[File Storage]
        Realtime[Realtime]
    end
    
    subgraph External[External Integrations]
        Git[Git Providers]
        LDAP[LDAP/AD]
    end
    
    UI --> Features
    Features --> State
    State --> Router
    Router --> Auth
    State --> DB
    State --> Edge
    Features --> Storage
    State --> Realtime
    Edge --> Git
    Edge --> LDAP`
  },
  {
    id: 'user-authentication-flow',
    title: 'User Authentication Flow',
    type: 'sequence',
    description: 'Sequence diagram showing the authentication process from login to session establishment.',
    mermaidCode: `sequenceDiagram
    participant U as User
    participant C as Client App
    participant A as Auth Service
    participant DB as Database
    
    U->>C: Enter credentials
    C->>A: POST /auth/login
    A->>DB: Validate credentials
    DB-->>A: User record
    A->>A: Generate JWT
    A-->>C: Return token + session
    C->>C: Store in localStorage
    C-->>U: Redirect to dashboard
    
    Note over C,A: Subsequent requests
    C->>A: Request with Bearer token
    A->>A: Validate JWT
    A-->>C: Authorized response`
  },
  {
    id: 'issue-lifecycle',
    title: 'Issue Lifecycle Flow',
    type: 'flow',
    description: 'Flow diagram showing how issues move through their lifecycle from creation to resolution.',
    mermaidCode: `flowchart TD
    A[Create Issue] --> B{Issue Type}
    B -->|Bug| C[Triage]
    B -->|Story| D[Backlog]
    B -->|Task| D
    B -->|Epic| E[Planning]
    
    C --> F[Open]
    D --> F
    E --> F
    
    F --> G[In Progress]
    G --> H{Review Needed?}
    H -->|Yes| I[In Review]
    H -->|No| J[Done]
    I --> K{Approved?}
    K -->|Yes| J
    K -->|No| G
    
    J --> L[Resolved]
    L --> M{Reopened?}
    M -->|Yes| F
    M -->|No| N[Closed]`
  },
  {
    id: 'board-interaction',
    title: 'Board Drag and Drop Flow',
    type: 'sequence',
    description: 'Sequence diagram showing the drag-and-drop interaction on Kanban/Scrum boards.',
    mermaidCode: `sequenceDiagram
    participant U as User
    participant B as Board UI
    participant V as Validation
    participant DB as Database
    participant RT as Realtime
    
    U->>B: Drag issue card
    B->>B: Show drop zones
    U->>B: Drop on new column
    B->>V: Check transition rules
    V->>V: Validate WIP limits
    V->>V: Check workflow
    
    alt Valid Transition
        V-->>B: Transition allowed
        B->>DB: Update issue status
        DB-->>RT: Broadcast change
        RT-->>B: Update all clients
        B-->>U: Show success
    else Invalid Transition
        V-->>B: Transition blocked
        B->>B: Revert card position
        B-->>U: Show error message
    end`
  },
  {
    id: 'git-integration-flow',
    title: 'Git Integration Flow',
    type: 'flow',
    description: 'Flow diagram showing how Git events are processed and linked to issues.',
    mermaidCode: `flowchart TD
    A[Git Event] --> B{Event Type}
    B -->|Push| C[Parse Commits]
    B -->|PR| D[Parse PR Title]
    B -->|Branch| E[Parse Branch Name]
    
    C --> F[Extract Issue Keys]
    D --> F
    E --> F
    
    F --> G{Keys Found?}
    G -->|Yes| H[Lookup Issues]
    G -->|No| I[Log Unlinked]
    
    H --> J{Smart Commit?}
    J -->|Yes| K[Parse Commands]
    K --> L[Execute Actions]
    L --> M[Update Issue]
    J -->|No| M
    
    M --> N[Create Link Record]
    N --> O[Send Notifications]
    O --> P[Update Dev Panel]`
  },
  {
    id: 'sprint-planning',
    title: 'Sprint Planning Flow',
    type: 'flow',
    description: 'Flow diagram showing the sprint planning and execution lifecycle.',
    mermaidCode: `flowchart TD
    A[View Backlog] --> B[Prioritize Items]
    B --> C[Create Sprint]
    C --> D[Set Sprint Goal]
    D --> E[Define Dates]
    
    E --> F[Drag Items to Sprint]
    F --> G{Capacity Check}
    G -->|OK| H[Start Sprint]
    G -->|Over| I[Adjust Scope]
    I --> F
    
    H --> J[Active Sprint]
    J --> K[Daily Work]
    K --> L{Sprint End?}
    L -->|No| K
    L -->|Yes| M[Review Sprint]
    
    M --> N[Complete Sprint]
    N --> O{Incomplete Items?}
    O -->|Yes| P[Move to Backlog]
    O -->|No| Q[Generate Report]
    P --> Q
    Q --> R[Sprint Retrospective]`
  },
  {
    id: 'core-erd',
    title: 'Core Entity Relationship Diagram',
    type: 'erd',
    description: 'Entity relationship diagram showing the core tables and their relationships.',
    mermaidCode: `erDiagram
    projects ||--o{ issues : contains
    projects ||--o{ boards : has
    projects ||--o{ sprints : has
    projects ||--o{ versions : has
    projects ||--o{ components : has
    
    issues ||--o{ comments : has
    issues ||--o{ attachments : has
    issues ||--o{ issue_history : logs
    issues ||--o{ issue_links : links
    issues }o--|| issue_types : type
    issues }o--|| issue_statuses : status
    issues }o--|| priorities : priority
    issues }o--o| sprints : assigned
    
    boards ||--o{ board_columns : has
    board_columns ||--o{ board_column_statuses : maps
    
    sprints }o--|| projects : belongs
    
    workflows ||--o{ workflow_transitions : has
    workflow_transitions }o--|| issue_statuses : from
    workflow_transitions }o--|| issue_statuses : to
    
    profiles ||--o{ issues : reports
    profiles ||--o{ issues : assigned
    profiles ||--o{ comments : authors`
  },
  {
    id: 'git-erd',
    title: 'Git Integration ERD',
    type: 'erd',
    description: 'Entity relationship diagram for Git integration tables.',
    mermaidCode: `erDiagram
    git_organizations ||--o{ git_repositories : contains
    git_repositories ||--o{ git_commits : has
    git_repositories ||--o{ git_branches : has
    git_repositories ||--o{ git_pull_requests : has
    git_repositories ||--o{ git_builds : has
    git_repositories ||--o{ git_deployments : has
    
    git_commits ||--o{ git_commit_issues : links
    git_commit_issues }o--|| issues : references
    
    git_pull_requests ||--o{ git_pull_request_issues : links
    git_pull_request_issues }o--|| issues : references
    
    git_branches }o--o| issues : tracks
    
    git_deployments }o--o| git_builds : from
    git_deployments ||--o{ git_deployment_issues : links
    
    git_organizations ||--o{ git_user_mappings : has
    git_user_mappings }o--o| profiles : maps`
  },
  {
    id: 'module-dependencies',
    title: 'Module Dependency Graph',
    type: 'architecture',
    description: 'Graph showing the relationships and dependencies between feature modules.',
    mermaidCode: `graph TD
    subgraph Core[Core Modules]
        Projects[Projects]
        Issues[Issues]
        Workflows[Workflows]
    end
    
    subgraph UI[UI Modules]
        Boards[Boards]
        Backlog[Backlog]
        Reports[Reports]
    end
    
    subgraph Integration[Integration Modules]
        Git[Git Integration]
        LDAP[LDAP]
    end
    
    subgraph Enterprise[Enterprise Modules]
        Access[Access Control]
        Audit[Audit Logs]
        Compliance[Compliance]
    end
    
    subgraph Extensions[Extension Modules]
        CustomFields[Custom Fields]
        Plugins[Plugins]
        Automation[Automation]
    end
    
    Projects --> Issues
    Projects --> Boards
    Projects --> Backlog
    Issues --> Workflows
    Issues --> Git
    Boards --> Issues
    Backlog --> Issues
    Reports --> Issues
    LDAP --> Access
    Access --> Audit
    CustomFields --> Issues
    Automation --> Issues`
  },
  {
    id: 'data-flow',
    title: 'Data Flow Architecture',
    type: 'flow',
    description: 'How data flows through the application from user action to persistence.',
    mermaidCode: `flowchart LR
    subgraph User[User Layer]
        A[User Action]
    end
    
    subgraph UI[UI Layer]
        B[React Component]
        C[Form Validation]
    end
    
    subgraph State[State Layer]
        D[TanStack Query]
        E[Optimistic Update]
        F[Cache]
    end
    
    subgraph API[API Layer]
        G[Supabase Client]
        H[Edge Function]
    end
    
    subgraph Data[Data Layer]
        I[(PostgreSQL)]
        J[RLS Policies]
        K[Triggers]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    D --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> I
    I --> G
    G --> D
    D --> F
    F --> B`
  }
];
