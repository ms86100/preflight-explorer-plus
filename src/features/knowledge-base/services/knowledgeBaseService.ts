/**
 * Knowledge Base Service
 * Handles all business logic for spaces, pages, and related operations
 * Following low cognitive complexity principles
 */

import type {
  Space,
  SpaceWithStats,
  Page,
  PageWithMeta,
  PageTreeNode,
  ContentBlock,
  Label,
  PageComment,
  PageTemplate,
  SearchResult,
  PageActivity,
  RecentPage,
  CreateSpaceInput,
  UpdateSpaceInput,
  CreatePageInput,
  UpdatePageInput,
  MovePageInput,
  PaginatedResponse,
  Breadcrumb,
} from '../types';

// ============================================
// Mock Data Store (Replace with Supabase later)
// ============================================

const generateId = (): string => crypto.randomUUID();
const now = (): string => new Date().toISOString();

const mockSpaces: Map<string, Space> = new Map();
const mockPages: Map<string, Page> = new Map();
const mockLabels: Map<string, Label> = new Map();
const mockTemplates: Map<string, PageTemplate> = new Map();
const mockComments: Map<string, PageComment> = new Map();
const mockRecentPages: RecentPage[] = [];

// Initialize with demo data
initializeDemoData();

function initializeDemoData(): void {
  const demoSpaceId = generateId();
  const demoPageId = generateId();
  
  const demoSpace: Space = {
    id: demoSpaceId,
    key: 'ENG',
    name: 'Engineering',
    description: 'Engineering team documentation and knowledge base',
    type: 'team',
    status: 'active',
    icon: '🛠️',
    color: '#3b82f6',
    homepage_id: demoPageId,
    created_by: 'system',
    created_at: now(),
    updated_at: now(),
  };
  
  const demoPage: Page = {
    id: demoPageId,
    space_id: demoSpaceId,
    title: 'Welcome to Engineering',
    slug: 'welcome-to-engineering',
    content: createWelcomeContent(),
    status: 'published',
    position: 0,
    version: 1,
    created_by: 'system',
    created_at: now(),
    updated_by: 'system',
    updated_at: now(),
    published_at: now(),
  };
  
  mockSpaces.set(demoSpace.id, demoSpace);
  mockPages.set(demoPage.id, demoPage);
  
  // Add more demo spaces
  addDemoSpace('PROD', 'Product', 'Product management documentation', 'team', '📦', '#10b981');
  addDemoSpace('OPS', 'Operations', 'DevOps and infrastructure guides', 'team', '⚙️', '#f59e0b');
  addDemoSpace('DOCS', 'Documentation', 'Public documentation', 'documentation', '📚', '#8b5cf6');
}

function addDemoSpace(key: string, name: string, description: string, type: Space['type'], icon: string, color: string): void {
  const id = generateId();
  mockSpaces.set(id, {
    id,
    key,
    name,
    description,
    type,
    status: 'active',
    icon,
    color,
    created_by: 'system',
    created_at: now(),
    updated_at: now(),
  });
}

function createWelcomeContent(): ContentBlock[] {
  return [
    {
      id: generateId(),
      type: 'heading',
      content: 'Welcome to the Engineering Knowledge Base',
      attributes: { level: 1 },
    },
    {
      id: generateId(),
      type: 'paragraph',
      content: 'This is your central hub for all engineering documentation, guides, and best practices.',
      attributes: {},
    },
    {
      id: generateId(),
      type: 'callout',
      content: 'Start by exploring the page tree on the left or create a new page using the button above.',
      attributes: { calloutType: 'info' },
    },
    {
      id: generateId(),
      type: 'heading',
      content: 'Quick Links',
      attributes: { level: 2 },
    },
    {
      id: generateId(),
      type: 'list',
      content: '- Getting Started Guide\n- Architecture Overview\n- API Documentation\n- Deployment Procedures',
      attributes: { listType: 'unordered' },
    },
  ];
}

// ============================================
// Space Operations
// ============================================

export async function getSpaces(): Promise<SpaceWithStats[]> {
  const spaces = Array.from(mockSpaces.values());
  
  return spaces
    .filter((space) => space.status !== 'deleted')
    .map((space) => ({
      ...space,
      page_count: countPagesInSpace(space.id),
      member_count: 5, // Mock value
      last_activity: now(),
    }));
}

function countPagesInSpace(spaceId: string): number {
  return Array.from(mockPages.values())
    .filter((page) => page.space_id === spaceId)
    .length;
}

export async function getSpaceByKey(key: string): Promise<Space | null> {
  const space = Array.from(mockSpaces.values())
    .find((s) => s.key === key && s.status !== 'deleted');
  
  return space ?? null;
}

export async function getSpaceById(id: string): Promise<Space | null> {
  const space = mockSpaces.get(id);
  
  if (!space || space.status === 'deleted') {
    return null;
  }
  
  return space;
}

export async function createSpace(input: CreateSpaceInput): Promise<Space> {
  const id = generateId();
  const timestamp = now();
  
  const space: Space = {
    id,
    key: input.key.toUpperCase(),
    name: input.name,
    description: input.description,
    type: input.type,
    status: 'active',
    icon: input.icon,
    color: input.color,
    created_by: 'current-user', // Replace with actual user
    created_at: timestamp,
    updated_at: timestamp,
  };
  
  mockSpaces.set(id, space);
  return space;
}

export async function updateSpace(id: string, input: UpdateSpaceInput): Promise<Space | null> {
  const space = mockSpaces.get(id);
  
  if (!space) {
    return null;
  }
  
  const updated: Space = {
    ...space,
    ...input,
    updated_at: now(),
  };
  
  mockSpaces.set(id, updated);
  return updated;
}

export async function deleteSpace(id: string): Promise<boolean> {
  const space = mockSpaces.get(id);
  
  if (!space) {
    return false;
  }
  
  // Soft delete
  mockSpaces.set(id, { ...space, status: 'deleted', updated_at: now() });
  return true;
}

// ============================================
// Page Operations
// ============================================

export async function getPagesBySpace(spaceId: string): Promise<Page[]> {
  return Array.from(mockPages.values())
    .filter((page) => page.space_id === spaceId && page.status !== 'archived')
    .sort((a, b) => a.position - b.position);
}

export async function getPageById(id: string): Promise<PageWithMeta | null> {
  const page = mockPages.get(id);
  
  if (!page) {
    return null;
  }
  
  const space = mockSpaces.get(page.space_id);
  
  if (!space) {
    return null;
  }
  
  return enrichPageWithMeta(page, space);
}

function enrichPageWithMeta(page: Page, space: Space): PageWithMeta {
  return {
    ...page,
    space: { id: space.id, key: space.key, name: space.name },
    author: { id: page.created_by, name: 'Demo User', email: 'demo@example.com' },
    last_editor: { id: page.updated_by, name: 'Demo User', email: 'demo@example.com' },
    labels: [],
    breadcrumbs: buildBreadcrumbs(page),
    child_count: countChildPages(page.id),
    comment_count: countPageComments(page.id),
    attachment_count: 0,
  };
}

function buildBreadcrumbs(page: Page): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [];
  let currentPage: Page | undefined = page;
  
  while (currentPage?.parent_id) {
    const parent = mockPages.get(currentPage.parent_id);
    if (parent) {
      breadcrumbs.unshift({ id: parent.id, title: parent.title, slug: parent.slug });
      currentPage = parent;
    } else {
      break;
    }
  }
  
  return breadcrumbs;
}

function countChildPages(pageId: string): number {
  return Array.from(mockPages.values())
    .filter((p) => p.parent_id === pageId)
    .length;
}

function countPageComments(pageId: string): number {
  return Array.from(mockComments.values())
    .filter((c) => c.page_id === pageId)
    .length;
}

export async function getPageBySlug(spaceKey: string, slug: string): Promise<PageWithMeta | null> {
  const space = await getSpaceByKey(spaceKey);
  
  if (!space) {
    return null;
  }
  
  const page = Array.from(mockPages.values())
    .find((p) => p.space_id === space.id && p.slug === slug);
  
  if (!page) {
    return null;
  }
  
  return enrichPageWithMeta(page, space);
}

export async function createPage(input: CreatePageInput): Promise<Page> {
  const id = generateId();
  const timestamp = now();
  const slug = generateSlug(input.title);
  
  const position = await getNextPosition(input.space_id, input.parent_id);
  
  const page: Page = {
    id,
    space_id: input.space_id,
    title: input.title,
    slug,
    content: input.content ?? [],
    status: input.status ?? 'draft',
    parent_id: input.parent_id,
    position,
    version: 1,
    created_by: 'current-user',
    created_at: timestamp,
    updated_by: 'current-user',
    updated_at: timestamp,
  };
  
  mockPages.set(id, page);
  return page;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getNextPosition(spaceId: string, parentId?: string): Promise<number> {
  const siblings = Array.from(mockPages.values())
    .filter((p) => p.space_id === spaceId && p.parent_id === parentId);
  
  if (siblings.length === 0) {
    return 0;
  }
  
  const maxPosition = Math.max(...siblings.map((p) => p.position));
  return maxPosition + 1;
}

export async function updatePage(id: string, input: UpdatePageInput): Promise<Page | null> {
  const page = mockPages.get(id);
  
  if (!page) {
    return null;
  }
  
  const updated: Page = {
    ...page,
    title: input.title ?? page.title,
    slug: input.title ? generateSlug(input.title) : page.slug,
    content: input.content ?? page.content,
    status: input.status ?? page.status,
    version: page.version + 1,
    updated_by: 'current-user',
    updated_at: now(),
    published_at: input.status === 'published' ? now() : page.published_at,
  };
  
  mockPages.set(id, updated);
  return updated;
}

export async function movePage(id: string, input: MovePageInput): Promise<Page | null> {
  const page = mockPages.get(id);
  
  if (!page) {
    return null;
  }
  
  const updated: Page = {
    ...page,
    parent_id: input.target_parent_id,
    position: input.target_position,
    space_id: input.target_space_id ?? page.space_id,
    updated_at: now(),
  };
  
  mockPages.set(id, updated);
  return updated;
}

export async function deletePage(id: string): Promise<boolean> {
  const page = mockPages.get(id);
  
  if (!page) {
    return false;
  }
  
  // Move children to parent
  const children = Array.from(mockPages.values())
    .filter((p) => p.parent_id === id);
  
  for (const child of children) {
    mockPages.set(child.id, { ...child, parent_id: page.parent_id });
  }
  
  mockPages.delete(id);
  return true;
}

// ============================================
// Page Tree Operations
// ============================================

export async function getPageTree(spaceId: string): Promise<PageTreeNode[]> {
  const pages = Array.from(mockPages.values())
    .filter((p) => p.space_id === spaceId && p.status !== 'archived');
  
  return buildTreeNodes(pages, undefined);
}

function buildTreeNodes(pages: Page[], parentId: string | undefined): PageTreeNode[] {
  return pages
    .filter((p) => p.parent_id === parentId)
    .sort((a, b) => a.position - b.position)
    .map((page) => {
      const children = buildTreeNodes(pages, page.id);
      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        position: page.position,
        children,
        hasChildren: children.length > 0,
        isExpanded: false,
      };
    });
}

// ============================================
// Labels
// ============================================

export async function getLabels(spaceId: string): Promise<Label[]> {
  return Array.from(mockLabels.values())
    .filter((label) => label.space_id === spaceId);
}

export async function createLabel(spaceId: string, name: string, color: Label['color']): Promise<Label> {
  const id = generateId();
  const label: Label = { id, space_id: spaceId, name, color };
  mockLabels.set(id, label);
  return label;
}

// ============================================
// Templates
// ============================================

export async function getTemplates(spaceId?: string): Promise<PageTemplate[]> {
  return Array.from(mockTemplates.values())
    .filter((t) => t.is_global || t.space_id === spaceId);
}

export async function getGlobalTemplates(): Promise<PageTemplate[]> {
  // Return some default templates
  return [
    {
      id: 'tpl-meeting-notes',
      name: 'Meeting Notes',
      description: 'Template for capturing meeting notes and action items',
      content: createMeetingNotesTemplate(),
      is_global: true,
      category: 'meetings',
      created_by: 'system',
      created_at: now(),
    },
    {
      id: 'tpl-how-to',
      name: 'How-To Guide',
      description: 'Step-by-step instructional guide',
      content: createHowToTemplate(),
      is_global: true,
      category: 'documentation',
      created_by: 'system',
      created_at: now(),
    },
    {
      id: 'tpl-decision',
      name: 'Decision Record',
      description: 'Document important decisions and their context',
      content: createDecisionTemplate(),
      is_global: true,
      category: 'decisions',
      created_by: 'system',
      created_at: now(),
    },
  ];
}

function createMeetingNotesTemplate(): ContentBlock[] {
  return [
    { id: generateId(), type: 'heading', content: 'Meeting Notes', attributes: { level: 1 } },
    { id: generateId(), type: 'paragraph', content: '**Date:** [Date]\n**Attendees:** [Names]\n**Location:** [Location/Link]', attributes: {} },
    { id: generateId(), type: 'heading', content: 'Agenda', attributes: { level: 2 } },
    { id: generateId(), type: 'list', content: '- Item 1\n- Item 2\n- Item 3', attributes: { listType: 'unordered' } },
    { id: generateId(), type: 'heading', content: 'Discussion Notes', attributes: { level: 2 } },
    { id: generateId(), type: 'paragraph', content: '[Add discussion notes here]', attributes: {} },
    { id: generateId(), type: 'heading', content: 'Action Items', attributes: { level: 2 } },
    { id: generateId(), type: 'list', content: '- [ ] Action 1 - @owner\n- [ ] Action 2 - @owner', attributes: { listType: 'task' } },
  ];
}

function createHowToTemplate(): ContentBlock[] {
  return [
    { id: generateId(), type: 'heading', content: 'How to [Task Name]', attributes: { level: 1 } },
    { id: generateId(), type: 'callout', content: 'Brief overview of what this guide covers and who it is for.', attributes: { calloutType: 'info' } },
    { id: generateId(), type: 'heading', content: 'Prerequisites', attributes: { level: 2 } },
    { id: generateId(), type: 'list', content: '- Prerequisite 1\n- Prerequisite 2', attributes: { listType: 'unordered' } },
    { id: generateId(), type: 'heading', content: 'Steps', attributes: { level: 2 } },
    { id: generateId(), type: 'list', content: '1. Step 1\n2. Step 2\n3. Step 3', attributes: { listType: 'ordered' } },
    { id: generateId(), type: 'heading', content: 'Troubleshooting', attributes: { level: 2 } },
    { id: generateId(), type: 'paragraph', content: 'Common issues and their solutions.', attributes: {} },
  ];
}

function createDecisionTemplate(): ContentBlock[] {
  return [
    { id: generateId(), type: 'heading', content: 'Decision: [Title]', attributes: { level: 1 } },
    { id: generateId(), type: 'paragraph', content: '**Status:** [Proposed/Accepted/Deprecated]\n**Date:** [Date]\n**Deciders:** [Names]', attributes: {} },
    { id: generateId(), type: 'heading', content: 'Context', attributes: { level: 2 } },
    { id: generateId(), type: 'paragraph', content: 'What is the issue that we are seeing that is motivating this decision?', attributes: {} },
    { id: generateId(), type: 'heading', content: 'Decision', attributes: { level: 2 } },
    { id: generateId(), type: 'paragraph', content: 'What is the change that we are proposing and/or doing?', attributes: {} },
    { id: generateId(), type: 'heading', content: 'Consequences', attributes: { level: 2 } },
    { id: generateId(), type: 'paragraph', content: 'What becomes easier or more difficult to do because of this change?', attributes: {} },
  ];
}

// ============================================
// Search
// ============================================

export async function searchKnowledgeBase(
  query: string, 
  options?: { spaceId?: string; limit?: number }
): Promise<SearchResult[]> {
  const limit = options?.limit ?? 20;
  const queryLower = query.toLowerCase();
  
  const results: SearchResult[] = [];
  
  // Search pages
  for (const page of mockPages.values()) {
    if (!matchesQuery(page.title, queryLower)) {
      continue;
    }
    
    const space = mockSpaces.get(page.space_id);
    if (!space || space.status === 'deleted') {
      continue;
    }
    
    if (options?.spaceId && page.space_id !== options.spaceId) {
      continue;
    }
    
    results.push({
      id: page.id,
      type: 'page',
      title: page.title,
      excerpt: extractExcerpt(page.content),
      space_key: space.key,
      space_name: space.name,
      page_id: page.id,
      page_title: page.title,
      updated_at: page.updated_at,
      highlight: highlightMatch(page.title, query),
    });
    
    if (results.length >= limit) {
      break;
    }
  }
  
  return results;
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

function extractExcerpt(content: ContentBlock[]): string {
  const textBlocks = content
    .filter((block) => block.type === 'paragraph')
    .slice(0, 2);
  
  return textBlocks.map((b) => b.content).join(' ').slice(0, 150);
}

function highlightMatch(text: string, query: string): string {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// Recent & Activity
// ============================================

export async function getRecentPages(userId: string, limit = 10): Promise<RecentPage[]> {
  return mockRecentPages
    .filter((r) => r.user_id === userId)
    .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime())
    .slice(0, limit);
}

export async function recordPageVisit(pageId: string, userId: string): Promise<void> {
  const page = mockPages.get(pageId);
  const space = page ? mockSpaces.get(page.space_id) : null;
  
  if (!page || !space) {
    return;
  }
  
  // Remove existing entry for this page
  const existingIndex = mockRecentPages.findIndex(
    (r) => r.page_id === pageId && r.user_id === userId
  );
  
  if (existingIndex !== -1) {
    mockRecentPages.splice(existingIndex, 1);
  }
  
  // Add new entry
  mockRecentPages.unshift({
    id: generateId(),
    page_id: pageId,
    user_id: userId,
    space_id: space.id,
    space_key: space.key,
    space_name: space.name,
    page_title: page.title,
    visited_at: now(),
  });
  
  // Keep only last 100 entries per user
  const userEntries = mockRecentPages.filter((r) => r.user_id === userId);
  if (userEntries.length > 100) {
    const toRemove = userEntries.slice(100);
    for (const entry of toRemove) {
      const idx = mockRecentPages.indexOf(entry);
      if (idx !== -1) {
        mockRecentPages.splice(idx, 1);
      }
    }
  }
}

export async function getPageActivity(pageId: string, limit = 20): Promise<PageActivity[]> {
  // Return mock activity for now
  const page = mockPages.get(pageId);
  
  if (!page) {
    return [];
  }
  
  return [
    {
      id: generateId(),
      page_id: pageId,
      action: 'created',
      actor_id: page.created_by,
      actor_name: 'Demo User',
      created_at: page.created_at,
    },
    {
      id: generateId(),
      page_id: pageId,
      action: 'published',
      actor_id: page.updated_by,
      actor_name: 'Demo User',
      created_at: page.published_at ?? page.updated_at,
    },
  ];
}

// ============================================
// Comments
// ============================================

export async function getPageComments(pageId: string): Promise<PageComment[]> {
  return Array.from(mockComments.values())
    .filter((c) => c.page_id === pageId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function addComment(
  pageId: string, 
  content: string, 
  parentId?: string
): Promise<PageComment> {
  const id = generateId();
  const timestamp = now();
  
  const comment: PageComment = {
    id,
    page_id: pageId,
    parent_id: parentId,
    content,
    created_by: 'current-user',
    created_at: timestamp,
    updated_at: timestamp,
    is_resolved: false,
  };
  
  mockComments.set(id, comment);
  return comment;
}

export async function resolveComment(id: string): Promise<boolean> {
  const comment = mockComments.get(id);
  
  if (!comment) {
    return false;
  }
  
  mockComments.set(id, { ...comment, is_resolved: true, updated_at: now() });
  return true;
}

// ============================================
// Content Block Helpers
// ============================================

export function createContentBlock(
  type: ContentBlock['type'], 
  content = '', 
  attributes: ContentBlock['attributes'] = {}
): ContentBlock {
  return {
    id: generateId(),
    type,
    content,
    attributes,
  };
}

export function duplicateContentBlock(block: ContentBlock): ContentBlock {
  return {
    ...structuredClone(block),
    id: generateId(),
  };
}
