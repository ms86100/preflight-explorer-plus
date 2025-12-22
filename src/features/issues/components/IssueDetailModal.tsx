import { useState, useEffect } from 'react';
import {
  X,
  Link as LinkIcon,
  Paperclip,
  Clock,
  MessageSquare,
  History,
  MoreHorizontal,
  User,
  Calendar,
  Flag,
  Tag,
  Zap,
  Bug,
  CheckSquare,
  Bookmark,
  Layers,
  Send,
  Loader2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useIssueById, useUpdateIssue, useIssueTypes, usePriorities, useStatuses, useCloneIssue } from '@/features/issues';
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

const ISSUE_TYPE_ICONS: Record<string, typeof Bug> = {
  Epic: Zap,
  Story: Bookmark,
  Task: CheckSquare,
  Bug: Bug,
  'Sub-task': Layers,
};

interface IssueDetailModalProps {
  issueId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Comment {
  id: string;
  author: { display_name: string; avatar_url: string | null };
  body: string;
  created_at: string;
}

export function IssueDetailModal({ issueId, open, onOpenChange }: IssueDetailModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ id: string; display_name: string | null; avatar_url: string | null }[]>([]);
  const [storyPointsInput, setStoryPointsInput] = useState<string>('');

  const { data: issue, isLoading, refetch } = useIssueById(issueId || '');
  const { data: priorities } = usePriorities();
  const { data: statuses } = useStatuses();
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
      supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .then(({ data }) => {
          setTeamMembers(data || []);
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
    const { data } = await supabase
      .from('comments')
      .select(`
        id,
        body,
        created_at,
        author:profiles!comments_author_id_fkey(display_name, avatar_url)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setComments(data as unknown as Comment[]);
    }
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
      const { error } = await supabase.from('comments').insert({
        issue_id: issueId,
        author_id: user.id,
        body: newComment.trim(),
      });
      if (error) throw error;
      setNewComment('');
      await fetchComments();
      toast.success('Comment added');
    } catch (error) {
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
    const newPoints = storyPointsInput.trim() === '' ? null : parseInt(storyPointsInput, 10);
    if (isNaN(newPoints as number) && storyPointsInput.trim() !== '') return;
    if (newPoints !== issue?.story_points) {
      await updateIssue.mutateAsync({ id: issueId, updates: { story_points: newPoints } });
      refetch();
    }
  };

  if (!issueId) return null;

  const IssueIcon = issue?.issue_type?.name ? ISSUE_TYPE_ICONS[issue.issue_type.name] || CheckSquare : CheckSquare;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : issue ? (
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
                          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.body}</p>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="flex gap-3 pt-4 border-t">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">You</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
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
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Issue not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}