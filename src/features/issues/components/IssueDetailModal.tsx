import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Flag,
  Zap,
  Bug,
  CheckSquare,
  Bookmark,
  Layers,
  Send,
  Loader2,
  Copy,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import { useIssueById, useUpdateIssue, usePriorities, useStatuses, useCloneIssue } from '@/features/issues';
import { useAvailableTransitions, useExecuteTransition } from '@/features/workflows';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ClassificationLevel } from '@/types/jira';
import { TimeTrackingSection } from './TimeTrackingSection';
import { AttachmentsSection } from './AttachmentsSection';
import { LinkedIssuesSection } from './LinkedIssuesSection';
import { IssueHistorySection } from './IssueHistorySection';
import { CustomFieldsForm } from '@/features/custom-fields/components/CustomFieldsForm';
import { MentionTextarea, renderMentions } from '@/features/comments';
import { Jobs, submitJob } from '@/lib/backgroundJobs';
import { DevelopmentPanel } from '@/features/git-integration';

const ISSUE_TYPE_ICONS: Record<string, typeof Bug> = {
  Epic: Zap,
  Story: Bookmark,
  Task: CheckSquare,
  Bug: Bug,
  'Sub-task': Layers,
};

interface IssueDetailModalProps {
  readonly issueId: string | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

interface Comment {
  readonly id: string;
  readonly author: { readonly display_name: string; readonly avatar_url: string | null };
  readonly body: string;
  readonly created_at: string;
}

export function IssueDetailModal({ issueId, open, onOpenChange }: IssueDetailModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; display_name: string | null; avatar_url: string | null }[]>([]);
  const [storyPointsInput, setStoryPointsInput] = useState<string>('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  const { data: issue, isLoading, refetch } = useIssueById(issueId || '');
  const { data: priorities } = usePriorities();
  useStatuses(); // Fetch statuses for potential use
  const { data: availableTransitions, isLoading: isLoadingTransitions } = useAvailableTransitions(issueId);
  const updateIssue = useUpdateIssue();
  const executeTransition = useExecuteTransition();
  const cloneIssue = useCloneIssue();

  const handleClone = () => {
    if (issueId) {
      cloneIssue.mutate(issueId);
    }
  };

  // Fetch team members for assignee selection
  useEffect(() => {
    if (open) {
      // Use secure RPC to fetch public profiles (non-sensitive fields only)
      supabase
        .rpc('search_public_profiles', { _search_term: null, _limit: 100 })
        .then(({ data }) => {
          setTeamMembers((data || []).map(p => ({
            id: p.id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
          })));
        });
    }
  }, [open]);

  // Sync story points with issue data
  useEffect(() => {
    if (issue) {
      setStoryPointsInput(issue.story_points?.toString() || '');
    }
  }, [issue?.story_points]);

  // Fetch comments
  const fetchComments = async () => {
    if (!issueId) return;

    const { data, error } = await supabase
      .from('comments')
      .select('id, body, created_at, author_id')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch comments:', error);
      return;
    }

    const rows = (data || []) as Array<{ id: string; body: string; created_at: string; author_id: string }>;
    const authorIds = [...new Set(rows.map(r => r.author_id).filter(Boolean))];

    let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    if (authorIds.length > 0) {
      // Use secure RPC to fetch public profiles (non-sensitive fields only)
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_public_profiles', { _user_ids: authorIds });

      if (profilesError) {
        console.error('Failed to fetch comment authors:', profilesError);
      } else {
        profileMap = new Map((profiles || []).map(p => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]));
      }
    }

    const mapped: Comment[] = rows.map((r) => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      author: profileMap.get(r.author_id) || { display_name: 'Unknown', avatar_url: null },
    }));

    setComments(mapped);
  };

  // Load comments when issue changes
  useEffect(() => {
    if (issueId && open) {
      fetchComments();
    }
  }, [issueId, open]);

  // Realtime subscription for comments
  useEffect(() => {
    if (!issueId || !open) return;
    
    const channel = supabase
      .channel(`comments-${issueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `issue_id=eq.${issueId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, open]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !issueId || !user?.id) return;
    
    setIsSubmittingComment(true);
    try {
      // Insert comment
      const { data: commentData, error } = await supabase.from('comments').insert({
        issue_id: issueId,
        author_id: user.id,
        body: newComment.trim(),
      }).select('id').single();
      
      if (error) throw error;
      
      // Insert mentions and send notifications
      if (mentionedUserIds.length > 0 && commentData) {
        // Store mentions
        const mentionInserts = mentionedUserIds.map(userId => ({
          comment_id: commentData.id,
          mentioned_user_id: userId,
        }));
        await supabase.from('comment_mentions').insert(mentionInserts);
        
        // Send notifications to mentioned users (excluding self)
        const usersToNotify = mentionedUserIds.filter(id => id !== user.id);
        if (usersToNotify.length > 0) {
          await submitJob(Jobs.sendNotifications(
            usersToNotify,
            'You were mentioned in a comment',
            `${user.email || 'Someone'} mentioned you in ${issue?.issue_key || 'an issue'}`,
            'mention'
          ));
        }
      }
      
      setNewComment('');
      setMentionedUserIds([]);
      await fetchComments();
      toast.success('Comment added');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (statusId: string) => {
    if (!issueId) return;
    const result = await executeTransition.mutateAsync({ issueId, toStatusId: statusId });
    if (result.success) {
      refetch();
    }
  };

  const handlePriorityChange = async (priorityId: string) => {
    if (!issueId) return;
    await updateIssue.mutateAsync({ id: issueId, updates: { priority_id: priorityId } });
    refetch();
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!issueId) return;
    await updateIssue.mutateAsync({ 
      id: issueId, 
      updates: { assignee_id: assigneeId === 'unassigned' ? null : assigneeId } 
    });
    refetch();
  };

  const handleStoryPointsBlur = async () => {
    if (!issueId) return;
    const newPoints = storyPointsInput.trim() === '' ? null : Number.parseInt(storyPointsInput, 10);
    if (newPoints !== null && Number.isNaN(newPoints) && storyPointsInput.trim() !== '') return;
    if (newPoints !== issue?.story_points) {
      await updateIssue.mutateAsync({ id: issueId, updates: { story_points: newPoints } });
      refetch();
    }
  };

  if (!issueId) return null;

  const IssueIcon = issue?.issue_type?.name ? ISSUE_TYPE_ICONS[issue.issue_type.name] || CheckSquare : CheckSquare;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!issue) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Issue not found
        </div>
      );
    }

    return (
      <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded"
                  style={{ backgroundColor: `${issue.issue_type?.color}20` }}
                >
                  <IssueIcon className="h-5 w-5" style={{ color: issue.issue_type?.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">{issue.issue_key}</span>
                    <ClassificationBadge level={issue.classification as ClassificationLevel} />
                  </div>
                  <SheetTitle className="text-lg mt-1">{issue.summary}</SheetTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClone}
                  disabled={cloneIssue.isPending}
                  title="Clone issue"
                >
                  {cloneIssue.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments
                  {comments.length > 0 && (
                    <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">{comments.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6 space-y-6">
                {/* Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select 
                      value={issue.status_id} 
                      onValueChange={handleStatusChange}
                      disabled={executeTransition.isPending}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: issue.status?.color }}
                            />
                            {issue.status?.name}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {/* Current status (always shown) */}
                        <SelectItem key={issue.status_id} value={issue.status_id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: issue.status?.color }}
                            />
                            {issue.status?.name}
                            <span className="text-xs text-muted-foreground">(current)</span>
                          </div>
                        </SelectItem>
                        
                        {/* Available transitions */}
                        {availableTransitions && availableTransitions.length > 0 ? (
                          availableTransitions.map((transition) => (
                            <SelectItem key={transition.to_status_id} value={transition.to_status_id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: transition.to_status_color }}
                                />
                                {transition.transition_name}
                              </div>
                            </SelectItem>
                          ))
                        ) : !isLoadingTransitions && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            No transitions available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <Select value={issue.priority_id || ''} onValueChange={handlePriorityChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities?.map((priority) => (
                          <SelectItem key={priority.id} value={priority.id}>
                            <div className="flex items-center gap-2">
                              <Flag className="h-3 w-3" style={{ color: priority.color }} />
                              {priority.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Story Points</Label>
                    <Input
                      type="number"
                      value={storyPointsInput}
                      onChange={(e) => setStoryPointsInput(e.target.value)}
                      onBlur={handleStoryPointsBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleStoryPointsBlur();
                        }
                      }}
                      placeholder="-"
                      className="mt-1 w-20 h-8"
                      min={0}
                    />
                  </div>
                </div>

                <Separator />

                {/* People */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Assignee</Label>
                    <Select 
                      value={issue.assignee_id || 'unassigned'} 
                      onValueChange={handleAssigneeChange}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {issue.assignee ? (
                              <>
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={issue.assignee.avatar_url || ''} />
                                  <AvatarFallback className="text-[10px]">
                                    {issue.assignee.display_name?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{issue.assignee.display_name}</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Unassigned</span>
                            )}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">Unassigned</span>
                        </SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={member.avatar_url || ''} />
                                <AvatarFallback className="text-[10px]">
                                  {member.display_name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {member.display_name || 'Unknown'}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Reporter</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {issue.reporter && (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={issue.reporter.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {issue.reporter.display_name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{issue.reporter.display_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                    {issue.description || (
                      <span className="text-muted-foreground italic">No description provided</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Time Tracking */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-3 block">Time Tracking</Label>
                  <TimeTrackingSection
                    issueId={issueId}
                    originalEstimate={issue.original_estimate}
                    remainingEstimate={issue.remaining_estimate}
                    timeSpent={issue.time_spent}
                    onUpdate={() => refetch()}
                  />
                </div>

                <Separator />

                {/* Linked Issues */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-3 block">Linked Issues</Label>
                  <LinkedIssuesSection
                    issueId={issueId}
                    projectId={issue.project_id}
                  />
                </div>

                <Separator />

                {/* Development Panel - Git Integration */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-3 block flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Development
                  </Label>
                  <DevelopmentPanel issueId={issueId} issueKey={issue.issue_key} projectId={issue.project_id} />
                </div>

                <Separator />

                {/* Custom Fields */}
                <CustomFieldsForm issueId={issueId} />

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-muted-foreground">
                  <div>
                    <span>Created: </span>
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span>Updated: </span>
                    <span>{new Date(issue.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {comment.author?.display_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.author?.display_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{renderMentions(comment.body)}</p>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">You</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <MentionTextarea
                        value={newComment}
                        onChange={setNewComment}
                        onMentions={setMentionedUserIds}
                        placeholder="Add a comment... Use @ to mention someone"
                        rows={3}
                        projectId={issue?.project_id}
                      />
                      <Button
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        {isSubmittingComment ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="mt-6">
                <AttachmentsSection issueId={issueId} />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <IssueHistorySection issueId={issueId} />
              </TabsContent>
            </Tabs>
          </>
        );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}