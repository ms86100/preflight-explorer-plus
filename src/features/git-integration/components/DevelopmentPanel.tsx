// Development Panel Component
// Main panel showing all Git/CI/CD info for an issue
// To be integrated into IssueDetailModal

import { useState } from 'react';
import { GitBranch, GitCommit, GitPullRequest, Rocket, Loader2, Plus, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIssueDevelopmentInfo } from '../hooks/useIssueDevelopmentInfo';
import { CommitsList } from './CommitsList';
import { BranchesList } from './BranchesList';
import { PullRequestsList } from './PullRequestsList';
import { DeploymentsList } from './DeploymentsList';
import { BuildStatusBadge } from './BuildStatusBadge';
import { CreateBranchModal } from './CreateBranchModal';
import { CreatePRModal } from './CreatePRModal';
import { TriggerBuildModal } from './TriggerBuildModal';

interface DevelopmentPanelProps {
  readonly issueId: string;
  readonly issueKey: string;
  readonly projectId: string;
  readonly onCreateBranch?: () => void;
}

export function DevelopmentPanel({ issueId, issueKey, projectId, onCreateBranch }: DevelopmentPanelProps) {
  const { data: devInfo, isLoading, error, refetch } = useIssueDevelopmentInfo(issueId, issueKey);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCreatePR, setShowCreatePR] = useState(false);
  const [showTriggerBuild, setShowTriggerBuild] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-sm text-destructive py-2">
        Failed to load development info
      </div>
    );
  }
  
  if (!devInfo) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        No development information available
      </div>
    );
  }
  
  const { summary } = devInfo;
  const hasAnyData = summary.commitCount > 0 || summary.branchCount > 0 || 
    summary.openPRCount > 0 || summary.mergedPRCount > 0 || 
    summary.deployedEnvironments.length > 0;
  
  const handleCreateBranchClick = () => {
    setShowCreateBranch(true);
    onCreateBranch?.();
  };

  const handleSuccess = () => {
    refetch();
  };
  
  if (!hasAnyData) {
    return (
      <>
        <div className="border border-dashed border-border rounded-lg p-4 text-center">
          <GitBranch className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            No development activity linked to this issue yet
          </p>
          <button
            onClick={handleCreateBranchClick}
            className="text-sm text-primary hover:underline"
          >
            Create a branch to get started
          </button>
        </div>

        <CreateBranchModal
          open={showCreateBranch}
          onOpenChange={setShowCreateBranch}
          issueKey={issueKey}
          issueId={issueId}
          projectId={projectId}
          onSuccess={handleSuccess}
        />
      </>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        {/* Summary row with action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
             {summary.branchCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <GitBranch className="h-3 w-3" />
                {summary.branchCount} branch{summary.branchCount !== 1 ? 'es' : ''}
              </Badge>
            )}
            {summary.commitCount > 0 && (
              <Badge variant="outline" className="gap-1">
                <GitCommit className="h-3 w-3" />
                {summary.commitCount} commit{summary.commitCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {(summary.openPRCount > 0 || summary.mergedPRCount > 0) && (
              <Badge variant="outline" className="gap-1">
                <GitPullRequest className="h-3 w-3" />
                {summary.openPRCount > 0 && `${summary.openPRCount} open`}
                {summary.openPRCount > 0 && summary.mergedPRCount > 0 && ', '}
                {summary.mergedPRCount > 0 && `${summary.mergedPRCount} merged`}
              </Badge>
            )}
            {summary.latestBuildStatus && (
              <BuildStatusBadge status={summary.latestBuildStatus} showLabel />
            )}
            {summary.deployedEnvironments.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Rocket className="h-3 w-3" />
                {summary.deployedEnvironments.join(', ')}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 text-xs"
              onClick={() => setShowCreateBranch(true)}
            >
              <Plus className="h-3 w-3" />
              Branch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 text-xs"
              onClick={() => setShowCreatePR(true)}
            >
              <Plus className="h-3 w-3" />
              PR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 text-xs"
              onClick={() => setShowTriggerBuild(true)}
            >
              <Play className="h-3 w-3" />
              Build
            </Button>
          </div>
        </div>
        
        {/* Tabbed details */}
        <Tabs defaultValue="commits" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="commits" className="gap-1 text-xs">
              <GitCommit className="h-3 w-3" />
              Commits
            </TabsTrigger>
            <TabsTrigger value="branches" className="gap-1 text-xs">
              <GitBranch className="h-3 w-3" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="prs" className="gap-1 text-xs">
              <GitPullRequest className="h-3 w-3" />
              PRs
            </TabsTrigger>
            <TabsTrigger value="deployments" className="gap-1 text-xs">
              <Rocket className="h-3 w-3" />
              Deploy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="commits" className="mt-3">
            <CommitsList commits={devInfo.commits} />
          </TabsContent>
          
          <TabsContent value="branches" className="mt-3">
            <BranchesList 
              branches={devInfo.branches} 
              onCreateBranch={() => setShowCreateBranch(true)}
            />
          </TabsContent>
          
          <TabsContent value="prs" className="mt-3">
            <PullRequestsList 
              pullRequests={devInfo.pullRequests} 
              onCreatePR={() => setShowCreatePR(true)}
            />
          </TabsContent>
          
          <TabsContent value="deployments" className="mt-3">
            <DeploymentsList deployments={devInfo.deployments} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateBranchModal
        open={showCreateBranch}
        onOpenChange={setShowCreateBranch}
        issueKey={issueKey}
        issueId={issueId}
        projectId={projectId}
        onSuccess={handleSuccess}
      />

      <CreatePRModal
        open={showCreatePR}
        onOpenChange={setShowCreatePR}
        issueKey={issueKey}
        issueId={issueId}
        projectId={projectId}
        branches={devInfo.branches}
        onSuccess={handleSuccess}
      />

      <TriggerBuildModal
        open={showTriggerBuild}
        onOpenChange={setShowTriggerBuild}
        projectId={projectId}
        branches={devInfo.branches}
        onSuccess={handleSuccess}
      />
    </>
  );
}
