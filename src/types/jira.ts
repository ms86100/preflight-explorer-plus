/**
 * @fileoverview Core type definitions for the Vertex Work Platform.
 * @module types/jira
 * 
 * @description
 * This module contains all core type definitions used throughout the application,
 * including types for projects, issues, users, boards, and compliance-related entities.
 * These types mirror the database schema and provide type safety for API operations.
 */

// ============================================================================
// Enums and Union Types
// ============================================================================

/**
 * Security classification levels for data access control.
 * Follows a hierarchical structure from least to most sensitive.
 * 
 * @remarks
 * - `public` - Accessible to all users
 * - `restricted` - Accessible to authenticated users only
 * - `confidential` - Accessible to users with appropriate clearance
 * - `export_controlled` - Subject to export control regulations
 */
export type ClassificationLevel = 'public' | 'restricted' | 'confidential' | 'export_controlled';

/**
 * Application-level roles for role-based access control.
 * 
 * @remarks
 * - `admin` - Full system access, can manage all settings and users
 * - `project_admin` - Can manage project settings and members
 * - `developer` - Can create and modify issues, view project data
 * - `viewer` - Read-only access to project data
 */
export type AppRole = 'admin' | 'project_admin' | 'developer' | 'viewer';

/**
 * Types of projects supported by the platform.
 * 
 * @remarks
 * - `software` - Software development projects with full Agile support
 * - `business` - Business projects with simplified workflow
 */
export type ProjectType = 'software' | 'business';

/**
 * Project methodology templates.
 * 
 * @remarks
 * - `scrum` - Agile Scrum with sprints, velocity tracking, and ceremonies
 * - `kanban` - Continuous flow with WIP limits
 * - `basic` - Simple task management without sprints
 * - `project_management` - Traditional project management features
 * - `task_management` - Simple task tracking
 * - `process_management` - Workflow-focused management
 */
export type ProjectTemplate = 'scrum' | 'kanban' | 'basic' | 'project_management' | 'task_management' | 'process_management';

/**
 * Issue type categories for grouping and behavior.
 * 
 * @remarks
 * - `standard` - Regular issues (Task, Bug, Story, etc.)
 * - `subtask` - Child issues that must have a parent
 * - `epic` - Container issues for grouping related work
 */
export type IssueTypeCategory = 'standard' | 'subtask' | 'epic';

/**
 * Sprint lifecycle states.
 * 
 * @remarks
 * - `future` - Sprint is planned but not yet started
 * - `active` - Sprint is currently in progress
 * - `closed` - Sprint has been completed
 */
export type SprintState = 'future' | 'active' | 'closed';

/**
 * Board visualization types.
 * 
 * @remarks
 * - `scrum` - Sprint-based board with backlog
 * - `kanban` - Continuous flow board with WIP limits
 */
export type BoardType = 'scrum' | 'kanban';

/**
 * Issue status categories for workflow grouping.
 * Used for burndown charts and velocity calculations.
 * 
 * @remarks
 * - `todo` - Work not yet started
 * - `in_progress` - Work currently being done
 * - `done` - Work completed
 */
export type StatusCategory = 'todo' | 'in_progress' | 'done';

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * User account information.
 * 
 * @interface User
 * @property {string} id - Unique identifier (UUID)
 * @property {string} email - User's email address
 * @property {string} display_name - Name shown in the UI
 * @property {string} [avatar_url] - URL to profile picture
 * @property {string} [job_title] - User's job title
 * @property {string} [department] - User's department
 * @property {string} [location] - User's physical location
 * @property {string} [timezone] - User's timezone (e.g., "America/New_York")
 * @property {boolean} is_active - Whether the account is active
 * @property {ClassificationLevel} [clearance_level] - Security clearance level
 * @property {string} [nationality] - User's nationality (for export control)
 * @property {string} created_at - ISO timestamp of account creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  job_title?: string;
  department?: string;
  location?: string;
  timezone?: string;
  is_active: boolean;
  clearance_level?: ClassificationLevel;
  nationality?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Project entity containing work items.
 * 
 * @interface Project
 * @property {string} id - Unique identifier (UUID)
 * @property {string} pkey - Project key used in issue keys (e.g., "PROJ")
 * @property {string} name - Human-readable project name
 * @property {string} [description] - Project description
 * @property {ProjectType} project_type - Type of project
 * @property {ProjectTemplate} template - Methodology template
 * @property {string} [category_id] - Reference to project category
 * @property {string} [lead_id] - Reference to project lead user
 * @property {User} [lead] - Populated project lead user
 * @property {string} [default_assignee_id] - Default assignee for new issues
 * @property {string} [avatar_url] - Project avatar image URL
 * @property {string} [url] - External project URL
 * @property {number} issue_counter - Counter for generating issue numbers
 * @property {boolean} is_archived - Whether project is archived
 * @property {ClassificationLevel} classification - Project classification level
 * @property {string} [program_id] - Reference to parent program
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Project {
  id: string;
  pkey: string;
  name: string;
  description?: string;
  project_type: ProjectType;
  template: ProjectTemplate;
  category_id?: string;
  lead_id?: string;
  lead?: User;
  default_assignee_id?: string;
  avatar_url?: string;
  url?: string;
  issue_counter: number;
  is_archived: boolean;
  classification: ClassificationLevel;
  program_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Issue type definition (e.g., Task, Bug, Story).
 * 
 * @interface IssueType
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Display name
 * @property {string} [description] - Description of when to use this type
 * @property {string} [icon_url] - URL to type icon
 * @property {string} color - Hex color code for UI display
 * @property {IssueTypeCategory} category - Category for behavior grouping
 * @property {boolean} is_subtask - Whether this type is for subtasks only
 * @property {number} position - Display order position
 */
export interface IssueType {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color: string;
  category: IssueTypeCategory;
  is_subtask: boolean;
  position: number;
}

/**
 * Priority level definition.
 * 
 * @interface Priority
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Priority name (e.g., "Critical", "High")
 * @property {string} [description] - When to use this priority
 * @property {string} [icon_url] - Priority icon URL
 * @property {string} color - Hex color for UI display
 * @property {number} position - Display order (lower = higher priority)
 */
export interface Priority {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color: string;
  position: number;
}

/**
 * Issue resolution definition.
 * 
 * @interface Resolution
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Resolution name (e.g., "Done", "Won't Fix")
 * @property {string} [description] - When to use this resolution
 * @property {number} position - Display order position
 */
export interface Resolution {
  id: string;
  name: string;
  description?: string;
  position: number;
}

/**
 * Issue workflow status definition.
 * 
 * @interface IssueStatus
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Status name (e.g., "In Progress")
 * @property {string} [description] - Status description
 * @property {string} color - Hex color for UI display
 * @property {StatusCategory} category - Category for reporting
 * @property {number} position - Display order position
 */
export interface IssueStatus {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: StatusCategory;
  position: number;
}

/**
 * Work item (issue) entity.
 * 
 * @interface Issue
 * @property {string} id - Unique identifier (UUID)
 * @property {string} project_id - Reference to parent project
 * @property {Project} [project] - Populated parent project
 * @property {string} issue_key - Human-readable key (e.g., "PROJ-123")
 * @property {number} issue_number - Numeric issue number within project
 * @property {string} summary - Issue title/summary
 * @property {string} [description] - Detailed description (markdown)
 * @property {string} issue_type_id - Reference to issue type
 * @property {IssueType} [issue_type] - Populated issue type
 * @property {string} status_id - Reference to current status
 * @property {IssueStatus} [status] - Populated current status
 * @property {string} [priority_id] - Reference to priority
 * @property {Priority} [priority] - Populated priority
 * @property {string} [resolution_id] - Reference to resolution (when resolved)
 * @property {Resolution} [resolution] - Populated resolution
 * @property {string} reporter_id - Reference to reporter user
 * @property {User} [reporter] - Populated reporter user
 * @property {string} [assignee_id] - Reference to assignee user
 * @property {User} [assignee] - Populated assignee user
 * @property {string} [parent_id] - Reference to parent issue (for subtasks)
 * @property {string} [epic_id] - Reference to epic issue
 * @property {Issue} [epic] - Populated epic issue
 * @property {string} [due_date] - ISO date string for due date
 * @property {number} [original_estimate] - Original time estimate in seconds
 * @property {number} [remaining_estimate] - Remaining time estimate in seconds
 * @property {number} [time_spent] - Time logged in seconds
 * @property {number} [story_points] - Agile story points estimate
 * @property {string} [environment] - Environment details for bugs
 * @property {string} [lexorank] - LexoRank for ordering
 * @property {ClassificationLevel} classification - Issue classification level
 * @property {string} [resolved_at] - ISO timestamp when resolved
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Issue {
  id: string;
  project_id: string;
  project?: Project;
  issue_key: string;
  issue_number: number;
  summary: string;
  description?: string;
  issue_type_id: string;
  issue_type?: IssueType;
  status_id: string;
  status?: IssueStatus;
  priority_id?: string;
  priority?: Priority;
  resolution_id?: string;
  resolution?: Resolution;
  reporter_id: string;
  reporter?: User;
  assignee_id?: string;
  assignee?: User;
  parent_id?: string;
  epic_id?: string;
  epic?: Issue;
  due_date?: string;
  original_estimate?: number;
  remaining_estimate?: number;
  time_spent?: number;
  story_points?: number;
  environment?: string;
  lexorank?: string;
  classification: ClassificationLevel;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Sprint entity for Scrum methodology.
 * 
 * @interface Sprint
 * @property {string} id - Unique identifier (UUID)
 * @property {string} board_id - Reference to parent board
 * @property {string} name - Sprint name (e.g., "Sprint 5")
 * @property {string} [goal] - Sprint goal description
 * @property {SprintState} state - Current sprint state
 * @property {string} [start_date] - ISO date string for start
 * @property {string} [end_date] - ISO date string for planned end
 * @property {string} [completed_date] - ISO timestamp when closed
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Sprint {
  id: string;
  board_id: string;
  name: string;
  goal?: string;
  state: SprintState;
  start_date?: string;
  end_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Board entity for visualizing work.
 * 
 * @interface Board
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Board display name
 * @property {string} project_id - Reference to parent project
 * @property {Project} [project] - Populated parent project
 * @property {BoardType} board_type - Type of board visualization
 * @property {string} [filter_jql] - JQL filter for board issues
 * @property {boolean} is_private - Whether board is private to owner
 * @property {string} [owner_id] - Reference to board owner
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Board {
  id: string;
  name: string;
  project_id: string;
  project?: Project;
  board_type: BoardType;
  filter_jql?: string;
  is_private: boolean;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Board column configuration.
 * 
 * @interface BoardColumn
 * @property {string} id - Unique identifier (UUID)
 * @property {string} board_id - Reference to parent board
 * @property {string} name - Column display name
 * @property {number} position - Column order position
 * @property {number} [min_issues] - Minimum WIP limit
 * @property {number} [max_issues] - Maximum WIP limit
 * @property {IssueStatus[]} [statuses] - Statuses mapped to this column
 */
export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
  min_issues?: number;
  max_issues?: number;
  statuses?: IssueStatus[];
}

/**
 * Issue comment entity.
 * 
 * @interface Comment
 * @property {string} id - Unique identifier (UUID)
 * @property {string} issue_id - Reference to parent issue
 * @property {string} author_id - Reference to comment author
 * @property {User} [author] - Populated author user
 * @property {string} body - Comment content (supports markdown and @mentions)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  author?: User;
  body: string;
  created_at: string;
  updated_at: string;
}

/**
 * File attachment entity.
 * 
 * @interface Attachment
 * @property {string} id - Unique identifier (UUID)
 * @property {string} issue_id - Reference to parent issue
 * @property {string} author_id - Reference to uploader
 * @property {User} [author] - Populated uploader user
 * @property {string} filename - Original filename
 * @property {string} file_path - Storage path
 * @property {number} file_size - File size in bytes
 * @property {string} mime_type - MIME type of file
 * @property {ClassificationLevel} classification - File classification level
 * @property {string} created_at - ISO timestamp of upload
 */
export interface Attachment {
  id: string;
  issue_id: string;
  author_id: string;
  author?: User;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  classification: ClassificationLevel;
  created_at: string;
}

/**
 * Project version/release entity.
 * 
 * @interface Version
 * @property {string} id - Unique identifier (UUID)
 * @property {string} project_id - Reference to parent project
 * @property {string} name - Version name (e.g., "1.0.0")
 * @property {string} [description] - Version description
 * @property {string} [start_date] - ISO date when work started
 * @property {string} [release_date] - ISO date of release
 * @property {boolean} is_released - Whether version is released
 * @property {boolean} is_archived - Whether version is archived
 * @property {number} position - Display order position
 */
export interface Version {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  start_date?: string;
  release_date?: string;
  is_released: boolean;
  is_archived: boolean;
  position: number;
}

/**
 * Project component for categorizing issues.
 * 
 * @interface Component
 * @property {string} id - Unique identifier (UUID)
 * @property {string} project_id - Reference to parent project
 * @property {string} name - Component name
 * @property {string} [description] - Component description
 * @property {string} [lead_id] - Reference to component lead
 * @property {User} [lead] - Populated component lead user
 */
export interface Component {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  lead_id?: string;
  lead?: User;
}

/**
 * Issue label for tagging.
 * 
 * @interface Label
 * @property {string} id - Unique identifier (UUID)
 * @property {string} project_id - Reference to parent project
 * @property {string} name - Label name
 */
export interface Label {
  id: string;
  project_id: string;
  name: string;
}

// ============================================================================
// Compliance & Audit Types
// ============================================================================

/**
 * Audit log entry for compliance tracking.
 * Records all significant actions for security and compliance purposes.
 * 
 * @interface AuditLog
 * @property {string} id - Unique identifier (UUID)
 * @property {string} [user_id] - Reference to acting user (null for system actions)
 * @property {User} [user] - Populated acting user
 * @property {string} action - Action type (e.g., "CREATE", "UPDATE", "DELETE")
 * @property {string} entity_type - Type of entity affected
 * @property {string} [entity_id] - ID of affected entity
 * @property {Record<string, unknown>} [old_values] - Previous values before change
 * @property {Record<string, unknown>} [new_values] - New values after change
 * @property {string} [ip_address] - IP address of request
 * @property {string} [user_agent] - Browser user agent string
 * @property {ClassificationLevel} [classification_context] - Classification level context
 * @property {string} created_at - ISO timestamp of action
 */
export interface AuditLog {
  id: string;
  user_id?: string;
  user?: User;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  classification_context?: ClassificationLevel;
  created_at: string;
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Navigation menu item configuration.
 * 
 * @interface NavItem
 * @property {string} title - Display title
 * @property {string} href - Navigation URL
 * @property {string} [icon] - Icon name from icon library
 * @property {string | number} [badge] - Optional badge content
 * @property {NavItem[]} [children] - Nested navigation items
 */
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}
