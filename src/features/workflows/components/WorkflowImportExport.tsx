import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, FileJson, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getWorkflowWithDetails } from '../services/workflowService';

interface WorkflowExportData {
  version: string;
  exportedAt: string;
  workflow: {
    name: string;
    description: string | null;
    steps: Array<{
      status_id: string;
      status_name?: string;
      position_x: number;
      position_y: number;
      is_initial: boolean;
    }>;
    transitions: Array<{
      from_status_id: string;
      to_status_id: string;
      name: string;
      description: string | null;
      conditions: any[];
      validators: any[];
      post_functions: any[];
    }>;
  };
}

interface WorkflowImportExportProps {
  readonly workflowId?: string;
  readonly workflowName?: string;
  readonly onImportComplete?: () => void;
}

export function WorkflowImportExport({ 
  workflowId, 
  workflowName,
  onImportComplete 
}: WorkflowImportExportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Export workflow to JSON
  const handleExport = async () => {
    if (!workflowId) {
      toast.error('No workflow selected');
      return;
    }
    
    try {
      const workflow = await getWorkflowWithDetails(workflowId);
      if (!workflow) {
        toast.error('Workflow not found');
        return;
      }
      
      const exportData: WorkflowExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        workflow: {
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps.map(step => ({
            status_id: step.status_id,
            status_name: step.status?.name,
            position_x: step.position_x,
            position_y: step.position_y,
            is_initial: step.is_initial,
          })),
          transitions: workflow.transitions.map(t => {
            const fromStep = workflow.steps.find(s => s.id === t.from_step_id);
            const toStep = workflow.steps.find(s => s.id === t.to_step_id);
            return {
              from_status_id: fromStep?.status_id || '',
              to_status_id: toStep?.status_id || '',
              name: t.name,
              description: t.description,
              conditions: t.conditions || [],
              validators: t.validators || [],
              post_functions: t.post_functions || [],
            };
          }),
        },
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${workflow.name.toLowerCase().split(/\s+/).join('-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      toast.success('Workflow exported successfully');
    } catch {
      toast.error('Failed to export workflow');
    }
  };
  
  // Handle file upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    file.text()
      .then((content) => {
        setImportData(content);
        setImportError(null);
        
        try {
          const parsed = JSON.parse(content) as WorkflowExportData;
          if (parsed.workflow?.name) {
            setImportName(parsed.workflow.name + ' (Imported)');
          }
        } catch {
          setImportError('Invalid JSON file');
        }
      })
      .catch(() => {
        setImportError('Failed to read file');
      });
  };
  
  // Import workflow from JSON
  const handleImport = async () => {
    if (!importData.trim()) {
      setImportError('Please provide workflow data');
      return;
    }
    
    if (!importName.trim()) {
      setImportError('Please provide a name for the imported workflow');
      return;
    }
    
    setIsImporting(true);
    setImportError(null);
    
    try {
      const data = JSON.parse(importData) as WorkflowExportData;
      
      if (!data.workflow || !data.workflow.steps) {
        throw new Error('Invalid workflow format');
      }
      
      // Create the new workflow
      const { data: newWorkflow, error: workflowError } = await supabase
        .from('workflows')
        .insert({
          name: importName.trim(),
          description: data.workflow.description,
          is_active: true,
        })
        .select()
        .single();
      
      if (workflowError) throw workflowError;
      
      // Map status names to IDs if needed
      const { data: statuses } = await supabase
        .from('issue_statuses')
        .select('id, name');
      
      const statusMap = new Map(statuses?.map(s => [s.name, s.id]) || []);
      const statusIdMap = new Map(statuses?.map(s => [s.id, s.id]) || []);
      
      // Create steps and track mapping from old status_id to new step_id
      const stepMapping = new Map<string, string>();
      
      for (const step of data.workflow.steps) {
        // Find status ID - first try direct ID, then try by name
        let statusId = statusIdMap.has(step.status_id) ? step.status_id : null;
        if (!statusId && step.status_name) {
          statusId = statusMap.get(step.status_name) || null;
        }
        
        if (!statusId) {
          console.warn(`Status not found: ${step.status_name || step.status_id}`);
          continue;
        }
        
        const { data: newStep, error: stepError } = await supabase
          .from('workflow_steps')
          .insert({
            workflow_id: newWorkflow.id,
            status_id: statusId,
            position_x: step.position_x,
            position_y: step.position_y,
            is_initial: step.is_initial,
          })
          .select()
          .single();
        
        if (stepError) throw stepError;
        stepMapping.set(step.status_id, newStep.id);
      }
      
      // Create transitions
      for (const transition of data.workflow.transitions) {
        const fromStepId = stepMapping.get(transition.from_status_id);
        const toStepId = stepMapping.get(transition.to_status_id);
        
        if (!fromStepId || !toStepId) {
          console.warn(`Could not create transition: ${transition.name}`);
          continue;
        }
        
        const { error: transitionError } = await supabase
          .from('workflow_transitions')
          .insert({
            workflow_id: newWorkflow.id,
            from_step_id: fromStepId,
            to_step_id: toStepId,
            name: transition.name,
            description: transition.description,
            conditions: transition.conditions,
            validators: transition.validators,
            post_functions: transition.post_functions,
          });
        
        if (transitionError) throw transitionError;
      }
      
      toast.success('Workflow imported successfully');
      setImportDialogOpen(false);
      setImportData('');
      setImportName('');
      onImportComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import workflow';
      setImportError(message);
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {workflowId && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </div>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Import Workflow
            </DialogTitle>
            <DialogDescription>
              Import a workflow from a JSON file or paste the configuration below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-file-upload">Upload JSON File</Label>
              <input
                id="workflow-file-upload"
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or paste JSON
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="import-data">Workflow JSON</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setImportError(null);
                }}
                placeholder='{"version": "1.0", "workflow": {...}}'
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="import-name">Workflow Name</Label>
              <Input
                id="import-name"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Enter a name for the imported workflow"
              />
            </div>
            
            {importError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isImporting || !importData.trim()}>
                {isImporting ? 'Importing...' : 'Import Workflow'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
