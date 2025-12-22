import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProjects } from '@/features/projects';
import { useBoardsByProject, useActiveSprint } from '@/features/boards';
import { 
  BurndownChart, 
  VelocityChart, 
  CumulativeFlowChart, 
  SprintReport,
  LeadCycleTimeChart,
  ControlChart,
  ReleaseBurndown,
  TeamWorkloadChart,
  IssueTypeDistribution,
  AgeingChart,
} from '@/features/reports';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Clock, Users } from 'lucide-react';

export default function ReportsPage() {
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const { data: boards } = useBoardsByProject(selectedProjectId);
  const boardId = boards?.[0]?.id || '';
  const { data: activeSprint } = useActiveSprint(boardId);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">Sprint metrics, velocity, and project insights</p>
          </div>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProjectId ? (
          <Tabs defaultValue="sprint" className="space-y-6">
            <TabsList>
              <TabsTrigger value="sprint" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Sprint
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Flow Metrics
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team & Backlog
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sprint" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeSprint && <BurndownChart sprintId={activeSprint.id} />}
                {boardId && <VelocityChart boardId={boardId} />}
                {activeSprint && <SprintReport sprintId={activeSprint.id} />}
                <ReleaseBurndown projectId={selectedProjectId} />
              </div>
            </TabsContent>

            <TabsContent value="flow" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeadCycleTimeChart projectId={selectedProjectId} />
                <ControlChart projectId={selectedProjectId} />
                <CumulativeFlowChart projectId={selectedProjectId} />
                <AgeingChart projectId={selectedProjectId} />
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamWorkloadChart projectId={selectedProjectId} />
                <IssueTypeDistribution projectId={selectedProjectId} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a project to view reports</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
