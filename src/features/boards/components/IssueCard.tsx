import { useMemo } from 'react';
import { GripVertical, Bug, Bookmark, CheckSquare, Zap, Layers } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import type { Issue, ClassificationLevel } from '@/types/jira';

interface IssueCardProps {
  readonly issue: {
    readonly id: string;
    readonly issue_key: string;
    readonly summary: string;
    readonly issue_type: 'Epic' | 'Story' | 'Task' | 'Bug' | 'Subtask';
    readonly priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
    readonly assignee?: {
      readonly display_name: string;
      readonly avatar_url?: string;
    };
    readonly story_points?: number;
    readonly classification?: ClassificationLevel;
    readonly labels?: readonly string[];
    readonly epic_name?: string;
    readonly epic_color?: string;
  };
  readonly isDragging?: boolean;
  readonly onSelect?: () => void;
}

const ISSUE_TYPE_ICONS = {
  Epic: { icon: Zap, color: 'text-[hsl(var(--issue-epic))]', bg: 'bg-[hsl(var(--issue-epic))]/10' },
  Story: { icon: Bookmark, color: 'text-[hsl(var(--issue-story))]', bg: 'bg-[hsl(var(--issue-story))]/10' },
  Task: { icon: CheckSquare, color: 'text-[hsl(var(--issue-task))]', bg: 'bg-[hsl(var(--issue-task))]/10' },
  Bug: { icon: Bug, color: 'text-[hsl(var(--issue-bug))]', bg: 'bg-[hsl(var(--issue-bug))]/10' },
  Subtask: { icon: Layers, color: 'text-[hsl(var(--issue-subtask))]', bg: 'bg-[hsl(var(--issue-subtask))]/10' },
};

const PRIORITY_CONFIG = {
  Highest: { color: 'text-[hsl(var(--priority-highest))]', icon: '⬆⬆' },
  High: { color: 'text-[hsl(var(--priority-high))]', icon: '⬆' },
  Medium: { color: 'text-[hsl(var(--priority-medium))]', icon: '=' },
  Low: { color: 'text-[hsl(var(--priority-low))]', icon: '⬇' },
  Lowest: { color: 'text-[hsl(var(--priority-lowest))]', icon: '⬇⬇' },
};

export function IssueCard({ issue, isDragging, onSelect }: IssueCardProps) {
  const typeConfig = ISSUE_TYPE_ICONS[issue.issue_type];
  const priorityConfig = PRIORITY_CONFIG[issue.priority];
  const TypeIcon = typeConfig.icon;

  const initials = useMemo(() => {
    if (!issue.assignee?.display_name) return '';
    return issue.assignee.display_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [issue.assignee?.display_name]);

  return (
    <div
      onClick={onSelect}
      className={`issue-card group relative ${
        isDragging ? 'shadow-lg ring-2 ring-primary opacity-90' : ''
      }`}
    >
      {/* Drag Handle */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Epic Badge */}
      {issue.epic_name && (
        <div
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2"
          style={{ backgroundColor: issue.epic_color || 'hsl(var(--issue-epic))', color: 'white' }}
        >
          {issue.epic_name}
        </div>
      )}

      {/* Summary */}
      <p className="text-sm font-medium text-foreground line-clamp-2 pl-4">{issue.summary}</p>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pl-4">
          {issue.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {label}
            </span>
          ))}
          {issue.labels.length > 3 && (
            <span className="text-xs text-muted-foreground">+{issue.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pl-4">
        <div className="flex items-center gap-2">
          {/* Issue Type */}
          <Tooltip>
            <TooltipTrigger>
              <div className={`p-1 rounded ${typeConfig.bg}`}>
                <TypeIcon className={`h-3.5 w-3.5 ${typeConfig.color}`} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{issue.issue_type}</TooltipContent>
          </Tooltip>

          {/* Issue Key */}
          <span className="text-xs font-medium text-muted-foreground hover:text-primary cursor-pointer">
            {issue.issue_key}
          </span>

          {/* Priority */}
          <Tooltip>
            <TooltipTrigger>
              <span className={`text-xs ${priorityConfig.color}`}>{priorityConfig.icon}</span>
            </TooltipTrigger>
            <TooltipContent>{issue.priority}</TooltipContent>
          </Tooltip>

          {/* Classification */}
          {issue.classification && issue.classification !== 'public' && (
            <ClassificationBadge level={issue.classification} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Story Points */}
          {issue.story_points !== undefined && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {issue.story_points}
            </span>
          )}

          {/* Assignee */}
          {issue.assignee && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={issue.assignee.avatar_url} />
                  <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{issue.assignee.display_name}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
