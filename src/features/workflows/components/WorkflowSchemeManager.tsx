import { useState } from 'react';
import { 
  useWorkflowSchemes, 
  useWorkflowSchemeWithMappings,
  useCreateWorkflowScheme,
  useUpsertWorkflowSchemeMapping,
  useDeleteWorkflowSchemeMapping,
  useAssignWorkflowScheme,
  useProjectWorkflowScheme
} from '../hooks/useWorkflowExecution';
import { useWorkflows } from '../hooks/useWorkflows';
import { useIssueTypes } from '@/features/issues/hooks/useIssues';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Plus, 
  Settings2, 
  Trash2, 
  Link2, 
  CheckCircle,
  GitBranch,
  FolderKanban,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkflowSchemeManager() {
  const { data: schemes, isLoading: schemesLoading } = useWorkflowSchemes();
  const { data: workflows } = useWorkflows();
  const { data: issueTypes } = useIssueTypes();
  const { data: projects } = useProjects();
  
  const createScheme = useCreateWorkflowScheme();
  const upsertMapping = useUpsertWorkflowSchemeMapping();
  const deleteMapping = useDeleteWorkflowSchemeMapping();
  const assignScheme = useAssignWorkflowScheme();
  
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeDescription, setNewSchemeDescription] = useState('');
  const [assignProjectId, setAssignProjectId] = useState<string>('');
  const [assignSchemeId, setAssignSchemeId] = useState<string>('');

  const { data: schemeWithMappings } = useWorkflowSchemeWithMappings(selectedSchemeId);

  const handleCreateScheme = () => {
    if (!newSchemeName.trim()) return;
    createScheme.mutate(
      { name: newSchemeName.trim(), description: newSchemeDescription.trim() || undefined },
      {
        onSuccess: (scheme) => {
          setIsCreateOpen(false);
          setNewSchemeName('');
          setNewSchemeDescription('');
          setSelectedSchemeId(scheme.id);
        },
      }
    );
  };

  const handleAddMapping = (issueTypeId: string | null, workflowId: string) => {
    if (!selectedSchemeId) return;
    upsertMapping.mutate({
      scheme_id: selectedSchemeId,
      issue_type_id: issueTypeId,
      workflow_id: workflowId,
    });
  };

  const handleDeleteMapping = (mappingId: string) => {
    deleteMapping.mutate(mappingId);
  };

  const handleAssignToProject = () => {
    if (!assignProjectId || !assignSchemeId) return;
    assignScheme.mutate(
      { projectId: assignProjectId, schemeId: assignSchemeId },
      {
        onSuccess: () => {
          setIsAssignOpen(false);
          setAssignProjectId('');
          setAssignSchemeId('');
        },
      }
    );
  };

  // Get unassigned issue types (not yet mapped in this scheme)
  const getUnmappedIssueTypes = () => {
    if (!issueTypes || !schemeWithMappings) return issueTypes || [];
    const mappedTypeIds = schemeWithMappings.mappings
      .filter(m => m.issue_type_id)
      .map(m => m.issue_type_id);
    return issueTypes.filter(it => !mappedTypeIds.includes(it.id));
  };

  if (schemesLoading) {
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
    <div className="space-y-6">
      <Tabs defaultValue="schemes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schemes">
            <Settings2 className="h-4 w-4 mr-2" />
            Workflow Schemes
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <Link2 className="h-4 w-4 mr-2" />
            Project Assignments
          </TabsTrigger>
        </TabsList>

        {/* Workflow Schemes Tab */}
        <TabsContent value="schemes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schemes List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Schemes</CardTitle>
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {schemes?.map(scheme => (
                    <button
                      type="button"
                      key={scheme.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 w-full text-left",
                        selectedSchemeId === scheme.id ? "bg-muted border-primary" : "border-border"
                      )}
                      onClick={() => setSelectedSchemeId(scheme.id)}
                      aria-label={`Select workflow scheme: ${scheme.name}`}
                      aria-pressed={selectedSchemeId === scheme.id}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{scheme.name}</span>
                        </div>
                        {scheme.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {scheme.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {scheme.description}
                        </p>
                      )}
                    </button>
                  ))}
                  {schemes?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No workflow schemes yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scheme Details / Mappings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {schemeWithMappings?.scheme.name || 'Select a Scheme'}
                </CardTitle>
                <CardDescription>
                  {schemeWithMappings?.scheme.description || 'Select a workflow scheme to view and edit its mappings'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSchemeId && schemeWithMappings ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Issue Type Mappings</h4>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Issue Type</TableHead>
                          <TableHead>Workflow</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Default mapping (applies to all unmapped types) */}
                        {schemeWithMappings.mappings
                          .filter(m => !m.issue_type_id)
                          .map(mapping => (
                            <TableRow key={mapping.id}>
                              <TableCell>
                                <Badge variant="outline">All Unmapped Types</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                                  {mapping.workflow?.name || 'Unknown'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={mapping.workflow_id}
                                  onValueChange={(value) => handleAddMapping(null, value)}
                                >
                                  <SelectTrigger className="h-8 w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {workflows?.map(wf => (
                                      <SelectItem key={wf.id} value={wf.id}>
                                        {wf.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        
                        {/* Issue type specific mappings */}
                        {schemeWithMappings.mappings
                          .filter(m => m.issue_type_id)
                          .map(mapping => (
                            <TableRow key={mapping.id}>
                              <TableCell>
                                <Badge>{mapping.issue_type?.name || 'Unknown'}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                                  {mapping.workflow?.name || 'Unknown'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={mapping.workflow_id}
                                    onValueChange={(value) => handleAddMapping(mapping.issue_type_id, value)}
                                  >
                                    <SelectTrigger className="h-8 w-[100px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {workflows?.map(wf => (
                                        <SelectItem key={wf.id} value={wf.id}>
                                          {wf.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteMapping(mapping.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>

                    {/* Add new mapping */}
                    {getUnmappedIssueTypes().length > 0 && (
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <span className="text-sm text-muted-foreground">Add mapping for:</span>
                        <Select
                          onValueChange={(issueTypeId) => {
                            // Default to first workflow
                            const defaultWorkflow = workflows?.[0];
                            if (defaultWorkflow) {
                              handleAddMapping(issueTypeId, defaultWorkflow.id);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select issue type" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUnmappedIssueTypes().map(it => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a scheme from the list to view its mappings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Project Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Project Workflow Assignments</CardTitle>
                <CardDescription>
                  Assign workflow schemes to projects to control which workflows are used for each issue type
                </CardDescription>
              </div>
              <Button onClick={() => setIsAssignOpen(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Assign Scheme
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Workflow Scheme</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects?.map(project => (
                    <ProjectWorkflowRow 
                      key={project.id} 
                      project={project} 
                      schemes={schemes || []}
                      onAssign={(schemeId) => assignScheme.mutate({ projectId: project.id, schemeId })}
                    />
                  ))}
                  {projects?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No projects found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Scheme Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workflow Scheme</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="scheme-name">Name</Label>
              <Input
                id="scheme-name"
                value={newSchemeName}
                onChange={(e) => setNewSchemeName(e.target.value)}
                placeholder="e.g., Software Development Scheme"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheme-description">Description</Label>
              <Textarea
                id="scheme-description"
                value={newSchemeDescription}
                onChange={(e) => setNewSchemeDescription(e.target.value)}
                placeholder="Describe this workflow scheme..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateScheme}
                disabled={!newSchemeName.trim() || createScheme.isPending}
              >
                Create Scheme
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign to Project Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Workflow Scheme to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="assign-project">Project</Label>
              <Select value={assignProjectId} onValueChange={setAssignProjectId}>
                <SelectTrigger id="assign-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4" />
                        {project.name} ({project.pkey})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-scheme">Workflow Scheme</Label>
              <Select value={assignSchemeId} onValueChange={setAssignSchemeId}>
                <SelectTrigger id="assign-scheme">
                  <SelectValue placeholder="Select a scheme" />
                </SelectTrigger>
                <SelectContent>
                  {schemes?.map(scheme => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        {scheme.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignToProject}
                disabled={!assignProjectId || !assignSchemeId || assignScheme.isPending}
              >
                Assign Scheme
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component to show project's current workflow scheme
function ProjectWorkflowRow({ 
  project, 
  schemes,
  onAssign 
}: { 
  readonly project: { readonly id: string; readonly name: string; readonly pkey: string }; 
  readonly schemes: readonly { readonly id: string; readonly name: string; readonly is_default: boolean }[];
  readonly onAssign: (schemeId: string) => void;
}) {
  const { data: projectScheme, isLoading } = useProjectWorkflowScheme(project.id);
  
  const currentScheme = projectScheme?.scheme || schemes.find(s => s.is_default);
  
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{project.name}</span>
          <Badge variant="outline">{project.pkey}</Badge>
        </div>
      </TableCell>
      <TableCell>
        {isLoading ? (
          <span className="text-muted-foreground">Loading...</span>
        ) : (
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            {currentScheme?.name || 'No scheme assigned'}
            {!projectScheme && currentScheme?.is_default && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Select 
          value={projectScheme?.scheme_id || ''} 
          onValueChange={onAssign}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Change scheme" />
          </SelectTrigger>
          <SelectContent>
            {schemes.map(scheme => (
              <SelectItem key={scheme.id} value={scheme.id}>
                {scheme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}