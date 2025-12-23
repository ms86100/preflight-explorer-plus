// Deployments List Component
// Shows deployments linked to an issue

import { Rocket, CheckCircle2, XCircle, Clock, Loader2, RotateCcw, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { GitDeployment, DeploymentEnvironment, DeploymentStatus } from '../types';

interface DeploymentsListProps {
  readonly deployments: readonly GitDeployment[];
}

const envConfig: Record<DeploymentEnvironment, {
  label: string;
  className: string;
}> = {
  production: {
    label: 'Production',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  staging: {
    label: 'Staging',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  development: {
    label: 'Development',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  testing: {
    label: 'Testing',
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  other: {
    label: 'Other',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const statusConfig: Record<DeploymentStatus, {
  icon: typeof CheckCircle2;
  className: string;
}> = {
  success: {
    icon: CheckCircle2,
    className: 'text-green-600',
  },
  failed: {
    icon: XCircle,
    className: 'text-red-600',
  },
  pending: {
    icon: Clock,
    className: 'text-yellow-600',
  },
  in_progress: {
    icon: Loader2,
    className: 'text-blue-600 animate-spin',
  },
  rolled_back: {
    icon: RotateCcw,
    className: 'text-orange-600',
  },
};

export function DeploymentsList({ deployments }: DeploymentsListProps) {
  if (deployments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No deployments linked yet
      </div>
    );
  }
  
  // Group by environment, show latest for each
  const envGroups = deployments.reduce((acc, dep) => {
    if (!acc[dep.environment]) {
      acc[dep.environment] = dep;
    }
    return acc;
  }, {} as Record<DeploymentEnvironment, GitDeployment>);
  
  const sortedEnvs: DeploymentEnvironment[] = ['production', 'staging', 'testing', 'development', 'other'];
  const orderedDeployments = sortedEnvs
    .filter(env => envGroups[env])
    .map(env => envGroups[env]);
  
  return (
    <div className="space-y-2">
      {orderedDeployments.map((deployment) => (
        <DeploymentItem key={deployment.id} deployment={deployment} />
      ))}
    </div>
  );
}

function DeploymentItem({ deployment }: { deployment: GitDeployment }) {
  const envCfg = envConfig[deployment.environment];
  const statusCfg = statusConfig[deployment.status];
  const StatusIcon = statusCfg.icon;
  
  const timeAgo = deployment.deployed_at
    ? formatDistanceToNow(new Date(deployment.deployed_at), { addSuffix: true })
    : '';
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
      <Rocket className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <Badge variant="outline" className={envCfg.className}>
          {envCfg.label}
        </Badge>
        <StatusIcon className={`h-4 w-4 ${statusCfg.className}`} />
        {deployment.web_url && (
          <a
            href={deployment.web_url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </a>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {deployment.deployed_by && <span>{deployment.deployed_by} • </span>}
        {timeAgo}
      </div>
    </div>
  );
}
