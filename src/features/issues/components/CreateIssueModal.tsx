import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateIssue, useIssueTypes, usePriorities, useStatuses } from '@/features/issues';
import { Loader2, Bug, CheckSquare, Bookmark, Zap, Layers, HelpCircle, Settings, Upload } from 'lucide-react';
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
  readonly projectId: string;
  readonly projectKey?: string;
  readonly statusId?: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: (issueKey: string) => void;
}

export function CreateIssueModal({
  projectId,
  projectKey = 'PRJ',
  statusId,
  open,
  onOpenChange,
  onSuccess,
}: CreateIssueModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);

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
      
      if (createAnother) {
        reset();
        toast.success(`Created ${result.issue_key}`);
      } else {
        onOpenChange(false);
        reset();
      }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">Create Issue</DialogTitle>
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              Configure Fields
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="px-6 py-4">
          <p className="text-xs text-muted-foreground mb-4">
            Required fields are marked with an asterisk <span className="text-destructive">*</span>
          </p>

          <div className="space-y-4">
            {/* Project (Read-only display) */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label className="text-sm font-medium text-right pt-2">Project<span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2 h-9 px-3 bg-muted rounded-sm border border-input text-sm">
                <div className="w-4 h-4 rounded-sm bg-primary flex items-center justify-center">
                  <span className="text-[10px] text-primary-foreground font-bold">{projectKey.slice(0, 1)}</span>
                </div>
                {projectKey} ({projectKey})
              </div>
            </div>

            {/* Issue Type */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label className="text-sm font-medium text-right pt-2 flex items-center justify-end gap-1">
                Issue Type<span className="text-destructive">*</span>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </Label>
              <Select
                value={selectedTypeId}
                onValueChange={(v) => setValue('issue_type_id', v)}
              >
                <SelectTrigger className="h-9">
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
                <p className="col-start-2 text-xs text-destructive">{errors.issue_type_id.message}</p>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label htmlFor="summary" className="text-sm font-medium text-right pt-2">Summary<span className="text-destructive">*</span></Label>
              <div>
                <Input
                  id="summary"
                  placeholder=""
                  className="h-9"
                  {...register('summary')}
                />
                {errors.summary && (
                  <p className="text-xs text-destructive mt-1">{errors.summary.message}</p>
                )}
              </div>
            </div>

            {/* Reporter */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label className="text-sm font-medium text-right pt-2">Reporter<span className="text-destructive">*</span></Label>
              <Select defaultValue="current">
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium">
                        U
                      </div>
                      Current User
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="col-start-2 text-xs text-muted-foreground">
                Start typing to get a list of possible matches.
              </p>
            </div>

            {/* Component/s */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label className="text-sm font-medium text-right pt-2">Component/s</Label>
              <div className="text-sm text-muted-foreground pt-2">None</div>
            </div>

            {/* Attachment */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label className="text-sm font-medium text-right pt-2">Attachment</Label>
              <div className="border-2 border-dashed border-border rounded-sm p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  Drop files to attach, or <button type="button" className="text-primary hover:underline">browse</button>.
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label htmlFor="description" className="text-sm font-medium text-right pt-2">Description</Label>
              <div>
                <div className="border border-input rounded-sm overflow-hidden">
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 border-b border-input">
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">Style</Button>
                    <span className="text-muted-foreground">|</span>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold">B</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs italic">I</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs underline">U</Button>
                  </div>
                  <Textarea
                    id="description"
                    placeholder=""
                    rows={6}
                    className="border-0 rounded-none focus-visible:ring-0 resize-none"
                    {...register('description')}
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary">Visual</Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">Text</Button>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label className="text-sm font-medium text-right pt-2">Priority</Label>
              <Select
                value={watch('priority_id') || ''}
                onValueChange={(v) => setValue('priority_id', v)}
              >
                <SelectTrigger className="h-9 w-48">
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

            {/* Story Points */}
            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
              <Label htmlFor="story_points" className="text-sm font-medium text-right pt-2">Story Points</Label>
              <Input
                id="story_points"
                type="number"
                min={0}
                max={100}
                placeholder=""
                className="h-9 w-24"
                {...register('story_points', {
                  setValueAs: (v) => (v === '' || v === null || typeof v === 'undefined' ? undefined : Number(v)),
                })}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="create-another" 
                checked={createAnother}
                onCheckedChange={(checked) => setCreateAnother(checked === true)}
              />
              <Label htmlFor="create-another" className="text-sm font-normal">Create another</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || !projectId || !defaultStatusId || !selectedTypeId}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create
              </Button>
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting} className="text-primary hover:text-primary hover:bg-transparent hover:underline">
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}