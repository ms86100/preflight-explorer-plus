import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkflowList, WorkflowDesigner } from '@/features/workflows';

export default function WorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('00000000-0000-0000-0000-000000000001');

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Workflow Designer</h1>
          <p className="text-muted-foreground">
            Configure issue workflows with drag-and-drop status transitions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <WorkflowList
              onSelectWorkflow={setSelectedWorkflowId}
              selectedWorkflowId={selectedWorkflowId}
            />
          </div>
          <div className="lg:col-span-3">
            {selectedWorkflowId ? (
              <WorkflowDesigner workflowId={selectedWorkflowId} />
            ) : (
              <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Select a workflow to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
