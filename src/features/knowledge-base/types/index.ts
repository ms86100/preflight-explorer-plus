/**
 * Knowledge Base Types - Confluence-like Knowledge Management
 * Following clean code principles and avoiding SonarCloud issues
 */

// ============================================
// Core Enums
// ============================================

export type SpaceType = 'team' | 'project' | 'personal' | 'documentation';
export type SpaceStatus = 'active' | 'archived' | 'deleted';
export type PageStatus = 'draft' | 'published' | 'archived';
export type PermissionLevel = 'view' | 'edit' | 'admin';
export type ContentBlockType = 
  | 'paragraph' 
  | 'heading' 
  | 'list' 
  | 'code' 
  | 'quote' 
  | 'table' 
  | 'image' 
  | 'divider'
  | 'callout'
  | 'expand'
  | 'jira-issue'
  | 'jira-macro';

export type LabelColor = 
  | 'blue' 
  | 'green' 
  | 'yellow' 
  | 'red' 
  | 'purple' 
  | 'gray';

// ============================================
// Space Types
// ============================================

export interface Space {
  readonly id: string;
  readonly key: string;
  name: string;
  description: string;
  type: SpaceType;
  status: SpaceStatus;
  icon?: string;
  color?: string;
  homepage_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceSettings {
  readonly space_id: string;
  allow_anonymous_access: boolean;
  default_page_status: PageStatus;
  enable_comments: boolean;
  enable_reactions: boolean;
  enable_page_tree: boolean;
  enable_labels: boolean;
  enable_attachments: boolean;
  max_attachment_size_mb: number;
}

export interface SpacePermission {
  readonly id: string;
  readonly space_id: string;
  principal_type: 'user' | 'group' | 'role';
  principal_id: string;
  permission_level: PermissionLevel;
  granted_by: string;
  granted_at: string;
}

// ============================================
// Page Types
// ============================================

export interface Page {
  readonly id: string;
  readonly space_id: string;
  title: string;
  slug: string;
  content: ContentBlock[];
  status: PageStatus;
  parent_id?: string;
  position: number;
  version: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  published_at?: string;
}

export interface PageVersion {
  readonly id: string;
  readonly page_id: string;
  version: number;
  title: string;
  content: ContentBlock[];
  change_message?: string;
  created_by: string;
  created_at: string;
}

export interface PageRestriction {
  readonly id: string;
  readonly page_id: string;
  restriction_type: 'view' | 'edit';
  principal_type: 'user' | 'group';
  principal_id: string;
}

// ============================================
// Content Block Types
// ============================================

export interface ContentBlock {
  readonly id: string;
  type: ContentBlockType;
  content: string;
  attributes: ContentBlockAttributes;
  children?: ContentBlock[];
}

export interface ContentBlockAttributes {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  listType?: 'ordered' | 'unordered' | 'task';
  language?: string;
  calloutType?: 'info' | 'success' | 'warning' | 'error' | 'note';
  alignment?: 'left' | 'center' | 'right';
  imageUrl?: string;
  imageAlt?: string;
  issueKey?: string;
  macroType?: string;
  macroParams?: Record<string, string>;
  tableData?: TableData;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  hasHeader: boolean;
}

// ============================================
// Label & Attachment Types
// ============================================

export interface Label {
  readonly id: string;
  readonly space_id: string;
  name: string;
  color: LabelColor;
  description?: string;
}

export interface PageLabel {
  readonly page_id: string;
  readonly label_id: string;
  added_by: string;
  added_at: string;
}

export interface Attachment {
  readonly id: string;
  readonly page_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

// ============================================
// Comment & Reaction Types
// ============================================

export interface PageComment {
  readonly id: string;
  readonly page_id: string;
  parent_id?: string;
  content: string;
  inline_marker?: InlineMarker;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_resolved: boolean;
}

export interface InlineMarker {
  block_id: string;
  start_offset: number;
  end_offset: number;
}

export interface PageReaction {
  readonly id: string;
  readonly page_id: string;
  reaction_type: string;
  user_id: string;
  created_at: string;
}

// ============================================
// Template Types
// ============================================

export interface PageTemplate {
  readonly id: string;
  readonly space_id?: string;
  name: string;
  description: string;
  content: ContentBlock[];
  is_global: boolean;
  category?: string;
  created_by: string;
  created_at: string;
}

// ============================================
// Search & Activity Types
// ============================================

export interface SearchResult {
  readonly id: string;
  type: 'page' | 'space' | 'attachment' | 'comment';
  title: string;
  excerpt: string;
  space_key: string;
  space_name: string;
  page_id?: string;
  page_title?: string;
  updated_at: string;
  highlight?: string;
}

export interface PageActivity {
  readonly id: string;
  readonly page_id: string;
  action: 'created' | 'updated' | 'published' | 'commented' | 'labeled' | 'viewed';
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  details?: string;
  created_at: string;
}

export interface RecentPage {
  readonly id: string;
  readonly page_id: string;
  readonly user_id: string;
  readonly space_id: string;
  space_key: string;
  space_name: string;
  page_title: string;
  visited_at: string;
}

// ============================================
// Tree & Navigation Types
// ============================================

export interface PageTreeNode {
  readonly id: string;
  title: string;
  slug: string;
  status: PageStatus;
  position: number;
  children: PageTreeNode[];
  hasChildren: boolean;
  isExpanded: boolean;
}

export interface Breadcrumb {
  readonly id: string;
  title: string;
  slug: string;
}

// ============================================
// Form & Input Types
// ============================================

export interface CreateSpaceInput {
  key: string;
  name: string;
  description: string;
  type: SpaceType;
  icon?: string;
  color?: string;
}

export interface UpdateSpaceInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: SpaceStatus;
}

export interface CreatePageInput {
  space_id: string;
  title: string;
  content?: ContentBlock[];
  parent_id?: string;
  template_id?: string;
  status?: PageStatus;
}

export interface UpdatePageInput {
  title?: string;
  content?: ContentBlock[];
  status?: PageStatus;
  change_message?: string;
}

export interface MovePageInput {
  target_parent_id?: string;
  target_position: number;
  target_space_id?: string;
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface SpaceWithStats extends Space {
  page_count: number;
  member_count: number;
  last_activity?: string;
}

export interface PageWithMeta extends Page {
  space: Pick<Space, 'id' | 'key' | 'name'>;
  author: UserInfo;
  last_editor: UserInfo;
  labels: Label[];
  breadcrumbs: Breadcrumb[];
  child_count: number;
  comment_count: number;
  attachment_count: number;
}

export interface UserInfo {
  readonly id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

// ============================================
// Editor State Types
// ============================================

export interface EditorState {
  page: Page | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: string;
  selectedBlockId?: string;
  cursorPosition?: CursorPosition;
}

export interface CursorPosition {
  block_id: string;
  offset: number;
}

export interface EditorCommand {
  type: 'insert' | 'delete' | 'update' | 'move';
  block_id?: string;
  block?: ContentBlock;
  position?: number;
}
