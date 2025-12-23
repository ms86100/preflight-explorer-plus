import { useState } from 'react';
import { 
  useWorkflows, 
  useCreateWorkflow, 
  useDeleteWorkflow, 
  useCloneWorkflow,
  useCreateWorkflowDraft,
  usePublishWorkflowDraft,
  useDiscardWorkflowDraft
} from '../hooks/useWorkflows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  GitBranch,
  CheckCircle,
  Settings,
  Copy,
  MoreVertical,
  GitCompare,
  FileEdit,
  Upload,
  X,
  PenSquare
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { WorkflowImportExport } from './WorkflowImportExport';
import { WorkflowComparison } from './WorkflowComparison';

interface WorkflowListProps {
  readonly projectId?: string;
  readonly onSelectWorkflow: (workflowId: string) => void;
  readonly selectedWorkflowId?: string;
}

export function WorkflowList({ projectId, onSelectWorkflow, selectedWorkflowId }: WorkflowListProps) {
  const { data: workflows, isLoading } = useWorkflows(projectId);
  const createWorkflow = useCreateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const cloneWorkflow = useCloneWorkflow();
  const createDraft = useCreateWorkflowDraft();
  const publishDraft = usePublishWorkflowDraft();
  const discardDraft = useDiscardWorkflowDraft();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [publishConfirmId, setPublishConfirmId] = useState<string | null>(null);
  const [discardConfirmId, setDiscardConfirmId] = useState<string | null>(null);
  const [cloneSourceId, setCloneSourceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    createWorkflow.mutate(
      { name, description, project_id: projectId },
      {
        onSuccess: (workflow) => {
          setIsCreateOpen(false);
          setName('');
          setDescription('');
          onSelectWorkflow(workflow.id);
        },
      }
    );
  };

  const handleClone = () => {
    if (!name.trim() || !cloneSourceId) return;
    cloneWorkflow.mutate(
      { sourceWorkflowId: cloneSourceId, newName: name.trim(), projectId },
      {
        onSuccess: (workflow) => {
          setIsCloneOpen(false);
          setCloneSourceId(null);
          setName('');
          onSelectWorkflow(workflow.id);
        },
      }
    );
  };

  const openCloneDialog = (workflowId: string, workflowName: string) => {
    setCloneSourceId(workflowId);
    setName(`${workflowName} (Copy)`);
    setIsCloneOpen(true);
  };

  const handleCreateDraft = (workflowId: string) => {
    createDraft.mutate(workflowId, {
      onSuccess: (draft) => {
        onSelectWorkflow(draft.id);
      }
    });
  };

  const handlePublishDraft = (draftId: string) => {
    publishDraft.mutate(draftId, {
      onSuccess: (workflow) => {
        onSelectWorkflow(workflow.id);
        setPublishConfirmId(null);
      }
    });
  };

  const handleDiscardDraft = (draftId: string) => {
    discardDraft.mutate(draftId, {
      onSuccess: () => {
        setDiscardConfirmId(null);
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Workflows
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bug Tracking Workflow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this workflow..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreate}
                    disabled={!name.trim() || createWorkflow.isPending}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WorkflowImportExport 
            workflowId={selectedWorkflowId}
            onImportComplete={() => {}}
          />
          <Button variant="outline" size="sm" onClick={() => setIsCompareOpen(true)}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {workflows?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No workflows yet</p>
            <p className="text-sm">Create a workflow to define issue transitions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workflows?.map(workflow => (
              <div
                key={workflow.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer
                  transition-colors hover:bg-muted/50
                  ${selectedWorkflowId === workflow.id ? 'bg-muted border-primary' : 'border-border'}
                `}
                onClick={() => onSelectWorkflow(workflow.id)}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{workflow.name}</span>
                      {workflow.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {(workflow as any).is_draft && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                          <PenSquare className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Draft actions for draft workflows */}
                    {(workflow as any).is_draft ? (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setPublishConfirmId(workflow.id);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Publish Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDiscardConfirmId(workflow.id);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Discard Draft
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateDraft(workflow.id);
                          }}
                          disabled={createDraft.isPending}
                        >
                          <FileEdit className="h-4 w-4 mr-2" />
                          Create Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openCloneDialog(workflow.id, workflow.name);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Clone Workflow
                        </DropdownMenuItem>
                        {!workflow.is_default && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWorkflow.mutate(workflow.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Workflow
                            </DropdownMenuItem>
                          </>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Clone Workflow Dialog */}
    <Dialog open={isCloneOpen} onOpenChange={(open) => {
      setIsCloneOpen(open);
      if (!open) {
        setCloneSourceId(null);
        setName('');
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Create a copy of this workflow including all statuses and transitions.
          </p>
          <div className="space-y-2">
            <Label htmlFor="clone-name">New Workflow Name</Label>
            <Input
              id="clone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name for the cloned workflow"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCloneOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleClone}
              disabled={!name.trim() || cloneWorkflow.isPending}
            >
              {cloneWorkflow.isPending ? 'Cloning...' : 'Clone Workflow'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Workflow Comparison */}
    <WorkflowComparison 
      open={isCompareOpen} 
      onOpenChange={setIsCompareOpen}
      initialWorkflowId={selectedWorkflowId}
    />

    {/* Publish Draft Confirmation */}
    <AlertDialog open={!!publishConfirmId} onOpenChange={(open) => !open && setPublishConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Draft?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace the live workflow with all changes from this draft. 
            The draft will be deleted after publishing. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => publishConfirmId && handlePublishDraft(publishConfirmId)}
            disabled={publishDraft.isPending}
          >
            {publishDraft.isPending ? 'Publishing...' : 'Publish Draft'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Discard Draft Confirmation */}
    <AlertDialog open={!!discardConfirmId} onOpenChange={(open) => !open && setDiscardConfirmId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard Draft?</AlertDialogTitle>
          <AlertDialogDescription>
            All changes in this draft will be permanently deleted. 
            The original workflow will remain unchanged. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => discardConfirmId && handleDiscardDraft(discardConfirmId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={discardDraft.isPending}
          >
            {discardDraft.isPending ? 'Discarding...' : 'Discard Draft'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}