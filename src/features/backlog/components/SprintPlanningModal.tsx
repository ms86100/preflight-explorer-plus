import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useStartSprint } from '@/features/boards';
import { toast } from 'sonner';

interface SprintPlanningModalProps {
  readonly sprintId: string;
  readonly sprintName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Pre-configured start date from sprint creation */
  readonly initialStartDate?: string | null;
  /** Pre-configured end date from sprint creation */
  readonly initialEndDate?: string | null;
  /** Pre-configured goal from sprint creation */
  readonly initialGoal?: string | null;
}

export function SprintPlanningModal({
  sprintId,
  sprintName,
  open,
  onOpenChange,
  initialStartDate,
  initialEndDate,
  initialGoal,
}: SprintPlanningModalProps) {
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startSprint = useStartSprint();

  // Initialize goal from sprint's saved configuration when modal opens
  useEffect(() => {
    if (open) {
      setGoal(initialGoal || '');
    }
  }, [open, initialGoal]);

  // Use pre-configured dates or defaults
  const startDate = initialStartDate ? new Date(initialStartDate) : new Date();
  const endDate = initialEndDate ? new Date(initialEndDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      await startSprint.mutateAsync({
        id: sprintId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      toast.success('Sprint started successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to start sprint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Start {sprintName}
          </DialogTitle>
          <DialogDescription>
            Ready to begin working on sprint items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Sprint Summary - Read-only dates */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{format(startDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">{format(endDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{duration} days</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-info/10 rounded-lg text-sm">
            <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">
              Sprint dates are configured when creating the sprint. 
              You can edit sprint details from the sprint settings.
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint-goal">Sprint Goal (optional)</Label>
            <Textarea
              id="sprint-goal"
              placeholder="What do you want to accomplish in this sprint?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Start Sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
