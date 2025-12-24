import { useState } from 'react';
import { Calendar, ChevronDown, Clock, Play, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { SprintState } from '@/types/jira';

const getSprintStateLozengeClass = (state: SprintState): string => {
  switch (state) {
    case 'active':
      return 'lozenge-inprogress';
    case 'closed':
      return 'lozenge-success';
    default:
      return 'lozenge-default';
  }
};

const getDaysRemainingClassName = (daysRemaining: number): string => {
  if (daysRemaining < 0) return 'text-destructive';
  if (daysRemaining <= 2) return 'text-warning';
  return '';
};

const getDaysRemainingText = (daysRemaining: number): string => {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`;
  return `${daysRemaining} days left`;
};

interface SprintHeaderProps {
  readonly sprint: {
    readonly id: string;
    readonly name: string;
    readonly goal?: string;
    readonly state: SprintState;
    readonly start_date?: string;
    readonly end_date?: string;
  };
  readonly stats: {
    readonly totalIssues: number;
    readonly completedIssues: number;
    readonly totalPoints: number;
    readonly completedPoints: number;
  };
  readonly onStartSprint?: () => void;
  readonly onCompleteSprint?: () => void;
  readonly onEditSprint?: () => void;
}

export function SprintHeader({
  sprint,
  stats,
  onStartSprint,
  onCompleteSprint,
  onEditSprint,
}: SprintHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const progressPercent = stats.totalIssues > 0
    ? Math.round((stats.completedIssues / stats.totalIssues) * 100)
    : 0;

  const pointsPercent = stats.totalPoints > 0
    ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
    : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!sprint.end_date) return null;
    const end = new Date(sprint.end_date);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-card border border-border rounded-lg">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </Button>
              </CollapsibleTrigger>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{sprint.name}</h2>
                  <span
                    className={`lozenge ${getSprintStateLozengeClass(sprint.state)}`}
                  >
                    {sprint.state}
                  </span>
                </div>
                {sprint.goal && (
                  <p className="text-sm text-muted-foreground mt-0.5">{sprint.goal}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sprint Dates */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                  </span>
                </div>

                {sprint.state === 'active' && daysRemaining !== null && (
                  <div
                    className={`flex items-center gap-1.5 ${getDaysRemainingClassName(daysRemaining)}`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{getDaysRemainingText(daysRemaining)}</span>
                  </div>
                )}
              </div>

              {/* Sprint Actions */}
              <div className="flex items-center gap-2">
                {sprint.state === 'future' && (
                  <Button size="sm" onClick={onStartSprint}>
                    <Play className="h-4 w-4 mr-1" />
                    Start Sprint
                  </Button>
                )}

                {sprint.state === 'active' && (
                  <Button size="sm" variant="outline" onClick={onCompleteSprint}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete Sprint
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEditSprint}>Edit sprint</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-6">
              {/* Issues Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Issues</span>
                  <span className="font-medium">
                    {stats.completedIssues} / {stats.totalIssues} ({progressPercent}%)
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Points Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Story Points</span>
                  <span className="font-medium">
                    {stats.completedPoints} / {stats.totalPoints} ({pointsPercent}%)
                  </span>
                </div>
                <Progress value={pointsPercent} className="h-2" />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
