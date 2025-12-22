import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkflowList, WorkflowDesigner, WorkflowSchemeManager } from '@/features/workflows';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, Settings2 } from 'lucide-react';

export default function WorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('00000000-0000-0000-0000-000000000001');

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Workflow Configuration</h1>
          <p className="text-muted-foreground">
            Design workflows and assign them to projects via workflow schemes
          </p>
        </div>

        <Tabs defaultValue="designer" className="w-full">
          <TabsList>
            <TabsTrigger value="designer">
              <GitBranch className="h-4 w-4 mr-2" />
              Workflow Designer
            </TabsTrigger>
            <TabsTrigger value="schemes">
              <Settings2 className="h-4 w-4 mr-2" />
              Workflow Schemes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="designer" className="mt-6">
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
          </TabsContent>

          <TabsContent value="schemes" className="mt-6">
            <WorkflowSchemeManager />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
