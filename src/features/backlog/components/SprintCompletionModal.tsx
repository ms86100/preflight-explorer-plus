import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface SprintCompletionModalProps {
  readonly sprintId: string;
  readonly sprintName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly incompleteIssueCount: number;
  readonly completedIssueCount: number;
  readonly nextSprintId?: string | null;
  readonly nextSprintName?: string | null;
}

export function SprintCompletionModal({
  sprintId,
  sprintName,
  open,
  onOpenChange,
  incompleteIssueCount,
  completedIssueCount,
  nextSprintId,
  nextSprintName,
}: SprintCompletionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incompleteAction, setIncompleteAction] = useState<'backlog' | 'next_sprint'>('backlog');
  const queryClient = useQueryClient();

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Get incomplete issues - using type assertion for tables not in current schema
      const { data: sprintIssues } = await (supabase.from as any)('sprint_issues')
        .select(`
          issue_id,
          issue:issues!inner(
            id,
            status_id,
            status:issue_statuses!inner(category)
          )
        `)
        .eq('sprint_id', sprintId);

      const incompleteIssueIds = (sprintIssues || [])
        .filter((si: any) => si.issue?.status?.category !== 'done')
        .map((si: any) => si.issue_id);

      // Handle incomplete issues based on user choice
      if (incompleteIssueIds.length > 0) {
        if (incompleteAction === 'next_sprint' && nextSprintId) {
          // Move incomplete issues to next sprint
          for (const issueId of incompleteIssueIds) {
            // Remove from current sprint
            await (supabase.from as any)('sprint_issues')
              .delete()
              .eq('sprint_id', sprintId)
              .eq('issue_id', issueId);

            // Add to next sprint
            await (supabase.from as any)('sprint_issues')
              .insert({ sprint_id: nextSprintId, issue_id: issueId });
          }
        } else {
          // Move to backlog (just remove from sprint)
          await (supabase.from as any)('sprint_issues')
            .delete()
            .eq('sprint_id', sprintId)
            .in('issue_id', incompleteIssueIds);
        }
      }

      // Close the sprint
      await (supabase.from as any)('sprints')
        .update({ 
          state: 'closed', 
          completed_date: new Date().toISOString() 
        })
        .eq('id', sprintId);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });

      toast.success(`Sprint "${sprintName}" completed successfully!`, {
        description: incompleteIssueIds.length > 0
          ? `${incompleteIssueIds.length} incomplete issue(s) moved to ${incompleteAction === 'next_sprint' ? nextSprintName : 'backlog'}`
          : `All ${completedIssueCount} issues completed!`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to complete sprint:', error);
      toast.error('Failed to complete sprint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Complete {sprintName}
          </DialogTitle>
          <DialogDescription>
            Review sprint completion and handle incomplete items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Sprint Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed Issues</span>
              <span className="font-medium text-success">{completedIssueCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Incomplete Issues</span>
              <span className="font-medium text-warning">{incompleteIssueCount}</span>
            </div>
          </div>

          {/* Incomplete Issues Handler */}
          {incompleteIssueCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  There are {incompleteIssueCount} incomplete issue(s) in this sprint. 
                  Choose where to move them:
                </span>
              </div>

              <RadioGroup 
                value={incompleteAction} 
                onValueChange={(v) => setIncompleteAction(v as 'backlog' | 'next_sprint')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="backlog" id="backlog" />
                  <Label htmlFor="backlog" className="flex-1 cursor-pointer">
                    <span className="font-medium">Move to Backlog</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Issues will be returned to the backlog for re-prioritization
                    </p>
                  </Label>
                </div>

                {nextSprintId && (
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="next_sprint" id="next_sprint" />
                    <Label htmlFor="next_sprint" className="flex-1 cursor-pointer">
                      <span className="font-medium">Move to {nextSprintName || 'Next Sprint'}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Issues will be carried over to the next sprint
                      </p>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Complete Sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
