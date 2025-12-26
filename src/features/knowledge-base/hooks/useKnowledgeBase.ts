/**
 * Knowledge Base Hooks
 * React Query hooks for data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as knowledgeBaseService from '../services/knowledgeBaseService';
import type {
  Space,
  SpaceWithStats,
  Page,
  PageWithMeta,
  PageTreeNode,
  Label,
  PageTemplate,
  SearchResult,
  PageActivity,
  RecentPage,
  CreateSpaceInput,
  UpdateSpaceInput,
  CreatePageInput,
  UpdatePageInput,
  MovePageInput,
  PageComment,
} from '../types';

// ============================================
// Query Keys
// ============================================

export const kbQueryKeys = {
  all: ['knowledge-base'] as const,
  spaces: () => [...kbQueryKeys.all, 'spaces'] as const,
  space: (key: string) => [...kbQueryKeys.spaces(), key] as const,
  spaceById: (id: string) => [...kbQueryKeys.spaces(), 'byId', id] as const,
  pages: (spaceId: string) => [...kbQueryKeys.all, 'pages', spaceId] as const,
  page: (id: string) => [...kbQueryKeys.all, 'page', id] as const,
  pageBySlug: (spaceKey: string, slug: string) => 
    [...kbQueryKeys.all, 'page', spaceKey, slug] as const,
  pageTree: (spaceId: string) => [...kbQueryKeys.all, 'tree', spaceId] as const,
  labels: (spaceId: string) => [...kbQueryKeys.all, 'labels', spaceId] as const,
  templates: (spaceId?: string) => [...kbQueryKeys.all, 'templates', spaceId] as const,
  search: (query: string) => [...kbQueryKeys.all, 'search', query] as const,
  recentPages: (userId: string) => [...kbQueryKeys.all, 'recent', userId] as const,
  pageActivity: (pageId: string) => [...kbQueryKeys.all, 'activity', pageId] as const,
  comments: (pageId: string) => [...kbQueryKeys.all, 'comments', pageId] as const,
};

// ============================================
// Space Hooks
// ============================================

export function useSpaces() {
  return useQuery<SpaceWithStats[]>({
    queryKey: kbQueryKeys.spaces(),
    queryFn: knowledgeBaseService.getSpaces,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSpace(key: string) {
  return useQuery<Space | null>({
    queryKey: kbQueryKeys.space(key),
    queryFn: () => knowledgeBaseService.getSpaceByKey(key),
    enabled: Boolean(key),
  });
}

export function useSpaceById(id: string) {
  return useQuery<Space | null>({
    queryKey: kbQueryKeys.spaceById(id),
    queryFn: () => knowledgeBaseService.getSpaceById(id),
    enabled: Boolean(id),
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();
  
  return useMutation<Space, Error, CreateSpaceInput>({
    mutationFn: knowledgeBaseService.createSpace,
    onSuccess: (space) => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.spaces() });
      toast.success(`Space "${space.name}" created successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to create space: ${error.message}`);
    },
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();
  
  return useMutation<Space | null, Error, { id: string; input: UpdateSpaceInput }>({
    mutationFn: ({ id, input }) => knowledgeBaseService.updateSpace(id, input),
    onSuccess: (space) => {
      if (space) {
        queryClient.invalidateQueries({ queryKey: kbQueryKeys.spaces() });
        queryClient.invalidateQueries({ queryKey: kbQueryKeys.space(space.key) });
        toast.success('Space updated successfully');
      }
    },
    onError: (error) => {
      toast.error(`Failed to update space: ${error.message}`);
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();
  
  return useMutation<boolean, Error, string>({
    mutationFn: knowledgeBaseService.deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.spaces() });
      toast.success('Space deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete space: ${error.message}`);
    },
  });
}

// ============================================
// Page Hooks
// ============================================

export function usePages(spaceId: string) {
  return useQuery<Page[]>({
    queryKey: kbQueryKeys.pages(spaceId),
    queryFn: () => knowledgeBaseService.getPagesBySpace(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function usePage(id: string) {
  return useQuery<PageWithMeta | null>({
    queryKey: kbQueryKeys.page(id),
    queryFn: () => knowledgeBaseService.getPageById(id),
    enabled: Boolean(id),
  });
}

export function usePageBySlug(spaceKey: string, slug: string) {
  return useQuery<PageWithMeta | null>({
    queryKey: kbQueryKeys.pageBySlug(spaceKey, slug),
    queryFn: () => knowledgeBaseService.getPageBySlug(spaceKey, slug),
    enabled: Boolean(spaceKey) && Boolean(slug),
  });
}

export function usePageTree(spaceId: string) {
  return useQuery<PageTreeNode[]>({
    queryKey: kbQueryKeys.pageTree(spaceId),
    queryFn: () => knowledgeBaseService.getPageTree(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  
  return useMutation<Page, Error, CreatePageInput>({
    mutationFn: knowledgeBaseService.createPage,
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.pages(page.space_id) });
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.pageTree(page.space_id) });
      toast.success(`Page "${page.title}" created`);
    },
    onError: (error) => {
      toast.error(`Failed to create page: ${error.message}`);
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  
  return useMutation<Page | null, Error, { id: string; input: UpdatePageInput }>({
    mutationFn: ({ id, input }) => knowledgeBaseService.updatePage(id, input),
    onSuccess: (page) => {
      if (page) {
        queryClient.invalidateQueries({ queryKey: kbQueryKeys.page(page.id) });
        queryClient.invalidateQueries({ queryKey: kbQueryKeys.pages(page.space_id) });
        queryClient.invalidateQueries({ queryKey: kbQueryKeys.pageTree(page.space_id) });
        toast.success('Page saved');
      }
    },
    onError: (error) => {
      toast.error(`Failed to save page: ${error.message}`);
    },
  });
}

export function useMovePage() {
  const queryClient = useQueryClient();
  
  return useMutation<Page | null, Error, { id: string; input: MovePageInput }>({
    mutationFn: ({ id, input }) => knowledgeBaseService.movePage(id, input),
    onSuccess: (page) => {
      if (page) {
        queryClient.invalidateQueries({ queryKey: kbQueryKeys.pageTree(page.space_id) });
        toast.success('Page moved');
      }
    },
    onError: (error) => {
      toast.error(`Failed to move page: ${error.message}`);
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  
  return useMutation<boolean, Error, { id: string; spaceId: string }>({
    mutationFn: ({ id }) => knowledgeBaseService.deletePage(id),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.pages(spaceId) });
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.pageTree(spaceId) });
      toast.success('Page deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete page: ${error.message}`);
    },
  });
}

// ============================================
// Label Hooks
// ============================================

export function useLabels(spaceId: string) {
  return useQuery<Label[]>({
    queryKey: kbQueryKeys.labels(spaceId),
    queryFn: () => knowledgeBaseService.getLabels(spaceId),
    enabled: Boolean(spaceId),
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  
  return useMutation<Label, Error, { spaceId: string; name: string; color: Label['color'] }>({
    mutationFn: ({ spaceId, name, color }) => 
      knowledgeBaseService.createLabel(spaceId, name, color),
    onSuccess: (label) => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.labels(label.space_id) });
      toast.success(`Label "${label.name}" created`);
    },
    onError: (error) => {
      toast.error(`Failed to create label: ${error.message}`);
    },
  });
}

// ============================================
// Template Hooks
// ============================================

export function useTemplates(spaceId?: string) {
  return useQuery<PageTemplate[]>({
    queryKey: kbQueryKeys.templates(spaceId),
    queryFn: () => knowledgeBaseService.getTemplates(spaceId),
  });
}

export function useGlobalTemplates() {
  return useQuery<PageTemplate[]>({
    queryKey: kbQueryKeys.templates('global'),
    queryFn: knowledgeBaseService.getGlobalTemplates,
    staleTime: Infinity, // Templates don't change often
  });
}

// ============================================
// Search Hooks
// ============================================

export function useKnowledgeBaseSearch(query: string, options?: { spaceId?: string }) {
  return useQuery<SearchResult[]>({
    queryKey: kbQueryKeys.search(query),
    queryFn: () => knowledgeBaseService.searchKnowledgeBase(query, options),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// Recent & Activity Hooks
// ============================================

export function useRecentPages(userId: string, limit = 10) {
  return useQuery<RecentPage[]>({
    queryKey: kbQueryKeys.recentPages(userId),
    queryFn: () => knowledgeBaseService.getRecentPages(userId, limit),
    enabled: Boolean(userId),
  });
}

export function useRecordPageVisit() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { pageId: string; userId: string }>({
    mutationFn: ({ pageId, userId }) => 
      knowledgeBaseService.recordPageVisit(pageId, userId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.recentPages(userId) });
    },
  });
}

export function usePageActivity(pageId: string) {
  return useQuery<PageActivity[]>({
    queryKey: kbQueryKeys.pageActivity(pageId),
    queryFn: () => knowledgeBaseService.getPageActivity(pageId),
    enabled: Boolean(pageId),
  });
}

// ============================================
// Comment Hooks
// ============================================

export function usePageComments(pageId: string) {
  return useQuery<PageComment[]>({
    queryKey: kbQueryKeys.comments(pageId),
    queryFn: () => knowledgeBaseService.getPageComments(pageId),
    enabled: Boolean(pageId),
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  
  return useMutation<PageComment, Error, { pageId: string; content: string; parentId?: string }>({
    mutationFn: ({ pageId, content, parentId }) => 
      knowledgeBaseService.addComment(pageId, content, parentId),
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.comments(comment.page_id) });
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

export function useResolveComment() {
  const queryClient = useQueryClient();
  
  return useMutation<boolean, Error, { id: string; pageId: string }>({
    mutationFn: ({ id }) => knowledgeBaseService.resolveComment(id),
    onSuccess: (_, { pageId }) => {
      queryClient.invalidateQueries({ queryKey: kbQueryKeys.comments(pageId) });
      toast.success('Comment resolved');
    },
    onError: (error) => {
      toast.error(`Failed to resolve comment: ${error.message}`);
    },
  });
}
