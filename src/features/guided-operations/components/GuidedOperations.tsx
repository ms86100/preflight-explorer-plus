import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, Play, CheckCircle, ArrowRight, Users, 
  FileEdit, ClipboardCheck, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import type { GuidedOperation } from '../types';

export function GuidedOperations() {
  const [activeOperation, setActiveOperation] = useState<GuidedOperation | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const operations: GuidedOperation[] = [
    {
      id: '1',
      name: 'Bulk Status Change',
      description: 'Change status for multiple items with validation',
      category: 'bulk',
      steps: [
        { id: 's1', name: 'Select Items', type: 'form', fields: [{ key: 'count', label: 'Items to update', type: 'text' }] },
        { id: 's2', name: 'Choose Status', type: 'form', fields: [{ key: 'status', label: 'New Status', type: 'select', options: ['To Do', 'In Progress', 'Done'] }] },
        { id: 's3', name: 'Confirm', type: 'confirmation' },
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Risk Escalation',
      description: 'Escalate issues with manager approval',
      category: 'approval',
      steps: [
        { id: 's1', name: 'Impact Assessment', type: 'form', fields: [
          { key: 'impact', label: 'Impact Description', type: 'textarea', required: true },
          { key: 'justification', label: 'Justification', type: 'textarea', required: true }
        ]},
        { id: 's2', name: 'Manager Approval', type: 'approval', approvers: ['manager'] },
        { id: 's3', name: 'Execute', type: 'action' },
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Sprint Closure',
      description: 'Close sprint with rollover handling',
      category: 'workflow',
      steps: [
        { id: 's1', name: 'Review Incomplete', type: 'form', fields: [{ key: 'action', label: 'Incomplete Items', type: 'select', options: ['Move to Backlog', 'Move to Next Sprint'] }] },
        { id: 's2', name: 'Add Notes', type: 'form', fields: [{ key: 'notes', label: 'Sprint Notes', type: 'textarea' }] },
        { id: 's3', name: 'Confirm Closure', type: 'confirmation' },
      ],
      created_at: new Date().toISOString(),
    },
  ];

  const categoryIcons = {
    bulk: <Users className="h-5 w-5" />,
    approval: <ClipboardCheck className="h-5 w-5" />,
    workflow: <Zap className="h-5 w-5" />,
  };

  const handleStartOperation = (op: GuidedOperation) => {
    setActiveOperation(op);
    setCurrentStepIndex(0);
    setFormValues({});
  };

  const handleNextStep = () => {
    if (!activeOperation) return;
    if (currentStepIndex < activeOperation.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      toast.success(`${activeOperation.name} completed successfully!`);
      setActiveOperation(null);
      setCurrentStepIndex(0);
    }
  };

  const handleCancel = () => {
    setActiveOperation(null);
    setCurrentStepIndex(0);
    setFormValues({});
  };

  if (activeOperation) {
    const currentStep = activeOperation.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / activeOperation.steps.length) * 100;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{activeOperation.name}</h2>
            <p className="text-sm text-muted-foreground">{activeOperation.description}</p>
          </div>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex gap-2 mb-4">
          {activeOperation.steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx < currentStepIndex ? 'bg-primary text-primary-foreground' :
                idx === currentStepIndex ? 'bg-primary/20 border-2 border-primary text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {idx < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`text-sm ${idx === currentStepIndex ? 'font-medium' : 'text-muted-foreground'}`}>
                {step.name}
              </span>
              {idx < activeOperation.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentStep.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep.type === 'form' && currentStep.fields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={String(formValues[field.key] || '')}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="w-full border rounded-md p-2"
                    value={String(formValues[field.key] || '')}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <Input
                    value={String(formValues[field.key] || '')}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            {currentStep.type === 'approval' && (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <p className="font-medium">Awaiting Approval</p>
                <p className="text-sm text-muted-foreground">This step requires manager approval</p>
                <Button className="mt-4" onClick={handleNextStep}>Simulate Approval</Button>
              </div>
            )}

            {currentStep.type === 'confirmation' && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <p className="font-medium">Confirm Action</p>
                <p className="text-sm text-muted-foreground">Are you sure you want to proceed?</p>
              </div>
            )}

            {currentStep.type === 'action' && (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="font-medium">Ready to Execute</p>
                <p className="text-sm text-muted-foreground">Click continue to complete the operation</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              {currentStepIndex > 0 && (
                <Button variant="outline" onClick={() => setCurrentStepIndex((prev) => prev - 1)}>
                  Back
                </Button>
              )}
              <Button onClick={handleNextStep}>
                {currentStepIndex === activeOperation.steps.length - 1 ? 'Complete' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Guided Operations
        </h2>
        <p className="text-sm text-muted-foreground">
          Execute multi-step workflows with validation and approvals
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {operations.map((op) => (
          <Card key={op.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {categoryIcons[op.category]}
                </div>
                <Badge variant="outline" className="capitalize">{op.category}</Badge>
              </div>
              <CardTitle className="text-base">{op.name}</CardTitle>
              <CardDescription>{op.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <span>{op.steps.length} steps</span>
              </div>
              <Button className="w-full" onClick={() => handleStartOperation(op)}>
                <Play className="h-4 w-4 mr-2" />
                Start Operation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
