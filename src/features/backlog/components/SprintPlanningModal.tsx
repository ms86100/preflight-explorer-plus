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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useStartSprint } from '@/features/boards';
import { toast } from 'sonner';

interface SprintPlanningModalProps {
  readonly sprintId: string;
  readonly sprintName: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function SprintPlanningModal({
  sprintId,
  sprintName,
  open,
  onOpenChange,
}: SprintPlanningModalProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14));
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startSprint = useStartSprint();

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
    } catch (error) {
      console.error('Failed to start sprint:', error);
      toast.error('Failed to start sprint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start {sprintName}</DialogTitle>
          <DialogDescription>
            Configure sprint dates and goal before starting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="sprint-start-date" variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(startDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="sprint-end-date" variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(endDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
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

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">Duration</p>
            <p className="text-muted-foreground">
              {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
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
