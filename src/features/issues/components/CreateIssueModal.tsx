import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateIssue, useIssueTypes, usePriorities, useStatuses } from '@/features/issues';
import { Loader2, Bug, CheckSquare, Bookmark, Zap, Layers } from 'lucide-react';
import { toast } from 'sonner';
import type { ClassificationLevel } from '@/types/jira';

const issueSchema = z.object({
  summary: z.string().min(1, 'Summary is required').max(255),
  description: z.string().optional(),
  issue_type_id: z.string().min(1, 'Issue type is required'),
  priority_id: z.string().optional(),
  story_points: z.number().min(0).max(100).optional(),
});

type IssueFormData = z.infer<typeof issueSchema>;

const ISSUE_TYPE_ICONS: Record<string, typeof Bug> = {
  Epic: Zap,
  Story: Bookmark,
  Task: CheckSquare,
  Bug: Bug,
  'Sub-task': Layers,
};

interface CreateIssueModalProps {
  projectId: string;
  statusId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (issueKey: string) => void;
}

export function CreateIssueModal({
  projectId,
  statusId,
  open,
  onOpenChange,
  onSuccess,
}: CreateIssueModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: issueTypes } = useIssueTypes();
  const { data: priorities } = usePriorities();
  const { data: statuses } = useStatuses();
  const createIssue = useCreateIssue();

  const defaultStatusId = statusId || statuses?.find((s) => s.category === 'todo')?.id || '';

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      summary: '',
      description: '',
      issue_type_id: '',
      priority_id: '',
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = form;

  const onFormSubmit = async (data: IssueFormData) => {
    if (!projectId) {
      toast.error('No project selected.');
      return;
    }

    if (!defaultStatusId) {
      toast.error('Issue statuses are still loading. Please try again in a moment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createIssue.mutateAsync({
        project_id: projectId,
        summary: data.summary,
        description: data.description,
        issue_type_id: data.issue_type_id,
        status_id: defaultStatusId,
        priority_id: data.priority_id || undefined,
        story_points: data.story_points,
        classification: 'restricted' as ClassificationLevel,
      });
      onSuccess?.(result.issue_key);
      onOpenChange(false);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const selectedTypeId = watch('issue_type_id');
  const selectedType = issueTypes?.find((t) => t.id === selectedTypeId);
  const TypeIcon = selectedType ? ISSUE_TYPE_ICONS[selectedType.name] || CheckSquare : CheckSquare;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
          <DialogDescription>Create a new issue in this project</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Issue Type *</Label>
            <Select
              value={selectedTypeId}
              onValueChange={(v) => setValue('issue_type_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes?.filter((t) => !t.is_subtask).map((type) => {
                  const Icon = ISSUE_TYPE_ICONS[type.name] || CheckSquare;
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: type.color }} />
                        {type.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.issue_type_id && (
              <p className="text-sm text-destructive">{errors.issue_type_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Input
              id="summary"
              placeholder="Enter issue summary"
              {...register('summary')}
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              rows={4}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={watch('priority_id') || ''}
                onValueChange={(v) => setValue('priority_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities?.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: priority.color }}
                        />
                        {priority.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="story_points">Story Points</Label>
              <Input
                id="story_points"
                type="number"
                min={0}
                max={100}
                placeholder="0"
                {...register('story_points', {
                  setValueAs: (v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)),
                })}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !projectId || !defaultStatusId || !selectedTypeId}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
