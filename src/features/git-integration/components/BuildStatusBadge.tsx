// Build Status Badge Component
// Shows CI/CD build status with appropriate styling

import { CheckCircle2, XCircle, Clock, Loader2, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { BuildStatus } from '../types';

interface BuildStatusBadgeProps {
  status: BuildStatus;
  pipelineName?: string;
  buildNumber?: string;
  webUrl?: string;
  showLabel?: boolean;
}

const statusConfig: Record<BuildStatus, {
  icon: typeof CheckCircle2;
  label: string;
  className: string;
}> = {
  success: {
    icon: CheckCircle2,
    label: 'Passed',
    className: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  running: {
    icon: Loader2,
    label: 'Running',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  canceled: {
    icon: Ban,
    label: 'Canceled',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function BuildStatusBadge({
  status,
  pipelineName,
  buildNumber,
  webUrl,
  showLabel = true,
}: BuildStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const tooltipContent = [
    pipelineName && `Pipeline: ${pipelineName}`,
    buildNumber && `Build: #${buildNumber}`,
    config.label,
  ].filter(Boolean).join(' • ');
  
  const badge = (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
  
  if (webUrl) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a href={webUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
            {badge}
          </a>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
}
