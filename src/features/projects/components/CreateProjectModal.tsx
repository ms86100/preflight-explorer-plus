import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import { Badge } from '@/components/ui/badge';
import { 
  FolderKanban, 
  LayoutGrid, 
  ListTodo, 
  AlertTriangle, 
  Shield, 
  GitBranch,
  Workflow,
  ArrowRight,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useWorkflowSchemes } from '@/features/workflows/hooks/useWorkflowExecution';
import { supabase } from '@/integrations/supabase/client';
import type { ClassificationLevel } from '@/types/jira';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  pkey: z.string()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key must be at most 10 characters')
    .regex(/^[A-Z][A-Z0-9]*$/, 'Key must start with a letter and contain only uppercase letters and numbers'),
  description: z.string().max(500).optional(),
  template: z.enum(['scrum', 'kanban', 'basic']),
  classification: z.enum(['public', 'restricted', 'confidential', 'export_controlled']),
  program_id: z.string().optional(),
  workflow_scheme_id: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

// Helper function moved outside component to avoid nested function (S2004)
const generateProjectKey = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || '';
};

interface CreateProjectModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit?: (data: ProjectFormData) => Promise<void>;
}

interface WorkflowSchemeDetails {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  statuses: string[];
  workflowName: string | null;
}

const TEMPLATES = [
  {
    id: 'scrum' as const,
    name: 'Scrum',
    description: 'Sprint-based agile development with backlog and velocity tracking',
    icon: FolderKanban,
    features: ['Sprint planning', 'Backlog', 'Velocity reports', 'Burndown charts'],
  },
  {
    id: 'kanban' as const,
    name: 'Kanban',
    description: 'Continuous flow with WIP limits and cycle time analytics',
    icon: LayoutGrid,
    features: ['Kanban board', 'WIP limits', 'Cumulative flow', 'Cycle time'],
  },
  {
    id: 'basic' as const,
    name: 'Basic',
    description: 'Simple issue tracking without agile methodology',
    icon: ListTodo,
    features: ['Issue tracking', 'Basic workflow', 'Search & filter'],
  },
];

const PROGRAMS = [
  { id: 'mrtt', name: 'MRTT Program', classification: 'export_controlled' },
  { id: 'a350', name: 'A350 Program', classification: 'confidential' },
  { id: 'a320', name: 'A320 Program', classification: 'restricted' },
  { id: 'general', name: 'General', classification: 'public' },
];

export function CreateProjectModal({ open, onOpenChange, onSubmit }: CreateProjectModalProps) {
  const [step, setStep] = useState<'template' | 'details' | 'workflow' | 'compliance'>('template');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemeDetails, setSchemeDetails] = useState<WorkflowSchemeDetails[]>([]);

  const { data: workflowSchemes } = useWorkflowSchemes();
  const defaultScheme = workflowSchemes?.find(s => s.is_default);

  // Fetch workflow scheme details with statuses
  useEffect(() => {
    async function fetchSchemeDetails() {
      if (!workflowSchemes || workflowSchemes.length === 0) return;

      const details: WorkflowSchemeDetails[] = [];

      for (const scheme of workflowSchemes) {
        // Get the workflow mappings for this scheme
        const { data: mappings } = await supabase
          .from('workflow_scheme_mappings')
          .select(`
            workflow_id,
            workflow:workflows(id, name)
          `)
          .eq('scheme_id', scheme.id)
          .limit(1);

        const workflowId = mappings?.[0]?.workflow_id;
        const workflowName = (mappings?.[0]?.workflow as { id: string; name: string } | null)?.name || null;

        let statuses: string[] = [];
        if (workflowId) {
          // Get unique statuses from workflow steps
          const { data: steps } = await supabase
            .from('workflow_steps')
            .select(`
              status:issue_statuses(id, name, position)
            `)
            .eq('workflow_id', workflowId)
            .order('position_x');

          if (steps) {
            // Steps are already ordered by position_x from the query
            // Extract unique statuses preserving the workflow sequence order
            const uniqueStatusNames: string[] = [];
            const seenIds = new Set<string>();
            
            steps.forEach((s: any) => {
              if (s.status && !seenIds.has(s.status.id)) {
                seenIds.add(s.status.id);
                uniqueStatusNames.push(s.status.name);
              }
            });
            
            statuses = uniqueStatusNames;
          }
        }

        details.push({
          id: scheme.id,
          name: scheme.name,
          description: scheme.description,
          is_default: scheme.is_default,
          statuses,
          workflowName,
        });
      }

      setSchemeDetails(details);
    }

    fetchSchemeDetails();
  }, [workflowSchemes]);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      pkey: '',
      description: '',
      template: 'scrum',
      classification: 'restricted', // Default to RESTRICTED per MRTT+ compliance
      program_id: '',
      workflow_scheme_id: '',
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const selectedTemplate = watch('template');
  const selectedClassification = watch('classification');
  const projectName = watch('name');
  const selectedSchemeId = watch('workflow_scheme_id');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    const currentKey = watch('pkey');
    if (!currentKey || currentKey === generateProjectKey(projectName)) {
      setValue('pkey', generateProjectKey(name));
    }
  };

  const onFormSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit?.(data);
      onOpenChange(false);
      form.reset();
      setStep('template');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setStep('template');
  };

  const selectedScheme = schemeDetails.find(s => s.id === selectedSchemeId) || 
    schemeDetails.find(s => s.is_default);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Create Project
          </DialogTitle>
          <DialogDescription>
            Set up a new project with your preferred workflow and security settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="template">1. Template</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedTemplate}>
              2. Details
            </TabsTrigger>
            <TabsTrigger value="workflow" disabled={!projectName}>
              3. Workflow
            </TabsTrigger>
            <TabsTrigger value="compliance" disabled={!projectName}>
              4. Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="mt-6">
            <fieldset className="grid gap-4">
              <legend className="text-sm font-medium mb-2">Choose a project template</legend>
              <div className="grid gap-3" role="radiogroup" aria-label="Project templates">
                {TEMPLATES.map((template) => (
                  <label
                    key={template.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={() => setValue('template', template.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        selectedTemplate === template.id ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <template.icon className={`h-6 w-6 ${
                          selectedTemplate === template.id ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {template.features.map((feature) => (
                            <span
                              key={feature}
                              className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </TabsContent>

          <TabsContent value="details" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Fleet Management System"
                {...register('name')}
                onChange={handleNameChange}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pkey">Project Key *</Label>
              <Input
                id="pkey"
                placeholder="e.g., FMS"
                maxLength={10}
                {...register('pkey')}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Used as prefix for issue keys (e.g., FMS-123)
              </p>
              {errors.pkey && (
                <p className="text-sm text-destructive">{errors.pkey.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the project scope and objectives"
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="mt-6 space-y-6">
            {/* Workflow Explanation */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-info/10 border border-info/30">
              <Info className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">What is a Workflow?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  A workflow defines the stages (statuses) an issue moves through from creation to completion.
                  It determines your board columns and controls how issues transition between states.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Choose a Workflow Scheme</Label>
              <p className="text-sm text-muted-foreground -mt-1">
                Select how issues will flow through your project
              </p>
              
              <div className="grid gap-3" role="radiogroup" aria-label="Workflow schemes">
                {schemeDetails.map((scheme) => (
                  <label
                    key={scheme.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      (selectedSchemeId === scheme.id || (!selectedSchemeId && scheme.is_default))
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="workflow_scheme"
                      value={scheme.id}
                      checked={selectedSchemeId === scheme.id || (!selectedSchemeId && scheme.is_default)}
                      onChange={() => setValue('workflow_scheme_id', scheme.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        (selectedSchemeId === scheme.id || (!selectedSchemeId && scheme.is_default))
                          ? 'bg-primary/10' 
                          : 'bg-muted'
                      }`}>
                        <Workflow className={`h-6 w-6 ${
                          (selectedSchemeId === scheme.id || (!selectedSchemeId && scheme.is_default))
                            ? 'text-primary' 
                            : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{scheme.name}</h3>
                          {scheme.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          {(selectedSchemeId === scheme.id || (!selectedSchemeId && scheme.is_default)) && (
                            <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                          )}
                        </div>
                        {scheme.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {scheme.description}
                          </p>
                        )}
                        {scheme.workflowName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Uses: <span className="font-medium">{scheme.workflowName}</span>
                          </p>
                        )}
                        
                        {/* Status Flow Preview */}
                        {scheme.statuses.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-2">Board columns:</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              {scheme.statuses.map((status, index) => (
                                <div key={status} className="flex items-center">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs font-normal whitespace-nowrap"
                                  >
                                    {status}
                                  </Badge>
                                  {index < scheme.statuses.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Selected Workflow Summary */}
            {selectedScheme && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <span className="font-medium">Your board will have {selectedScheme.statuses.length} columns:</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedScheme.statuses.join(' → ')}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compliance" className="mt-6 space-y-6">
            {/* MRTT+ Compliance Warning */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
              <Shield className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">MRTT+ Classification Required</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  All projects must be assigned a security classification. Default is RESTRICTED.
                  Export-controlled data requires additional access controls.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="security-classification">Security Classification *</Label>
              <Select
                value={selectedClassification}
                onValueChange={(value) => setValue('classification', value as ClassificationLevel)}
              >
                <SelectTrigger id="security-classification">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <ClassificationBadge level="public" />
                      <span className="text-sm">- Unrestricted access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="restricted">
                    <div className="flex items-center gap-2">
                      <ClassificationBadge level="restricted" />
                      <span className="text-sm">- Internal use only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="confidential">
                    <div className="flex items-center gap-2">
                      <ClassificationBadge level="confidential" />
                      <span className="text-sm">- Need-to-know basis</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="export_controlled">
                    <div className="flex items-center gap-2">
                      <ClassificationBadge level="export_controlled" />
                      <span className="text-sm">- ITAR/EAR regulated</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.classification && (
                <p className="text-sm text-destructive">{errors.classification.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="program-association">Program Association</Label>
              <Select
                value={watch('program_id') || ''}
                onValueChange={(value) => setValue('program_id', value)}
              >
                <SelectTrigger id="program-association">
                  <SelectValue placeholder="Select a program (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      <div className="flex items-center gap-2">
                        <span>{program.name}</span>
                        <ClassificationBadge level={program.classification as ClassificationLevel} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Linking to a program enforces program-level access controls
              </p>
            </div>

            {selectedClassification === 'export_controlled' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-destructive">Export Control Notice</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    This project will contain export-controlled technical data. Access will be
                    restricted based on nationality, clearance level, and program authorization.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          
          {step === 'template' && (
            <Button onClick={() => setStep('details')}>
              Continue
            </Button>
          )}
          
          {step === 'details' && (
            <>
              <Button variant="ghost" onClick={() => setStep('template')}>
                Back
              </Button>
              <Button 
                onClick={() => setStep('workflow')}
                disabled={!projectName || !watch('pkey')}
              >
                Continue
              </Button>
            </>
          )}
          
          {step === 'workflow' && (
            <>
              <Button variant="ghost" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button onClick={() => setStep('compliance')}>
                Continue
              </Button>
            </>
          )}
          
          {step === 'compliance' && (
            <>
              <Button variant="ghost" onClick={() => setStep('workflow')}>
                Back
              </Button>
              <Button
                onClick={handleSubmit(onFormSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
