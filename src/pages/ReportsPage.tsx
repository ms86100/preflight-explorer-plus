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
  ExecutiveSummary,
  PriorityBreakdown,
  RecentActivity,
  TrendAnalysis,
  OverdueAnalysis,
  ResolutionTimeChart,
  ContributorPerformance,
} from '@/features/reports';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Clock, Users, LayoutDashboard, Target } from 'lucide-react';

export default function ReportsPage() {
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const { data: boards } = useBoardsByProject(selectedProjectId);
  const boardId = boards?.[0]?.id || '';
  const { data: activeSprint } = useActiveSprint(boardId);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">Comprehensive project insights and metrics</p>
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
          <Tabs defaultValue="executive" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="executive" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Executive
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Performance
              </TabsTrigger>
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
                Team
              </TabsTrigger>
            </TabsList>

            {/* Executive Dashboard - New comprehensive view */}
            <TabsContent value="executive" className="space-y-6">
              <ExecutiveSummary projectId={selectedProjectId} />
              <TrendAnalysis projectId={selectedProjectId} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivity projectId={selectedProjectId} />
                <OverdueAnalysis projectId={selectedProjectId} />
              </div>
            </TabsContent>

            {/* Performance Analysis - Deep dive into delivery */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PriorityBreakdown projectId={selectedProjectId} />
                <ResolutionTimeChart projectId={selectedProjectId} />
                <ContributorPerformance projectId={selectedProjectId} />
                <IssueTypeDistribution projectId={selectedProjectId} />
              </div>
            </TabsContent>

            {/* Sprint Metrics */}
            <TabsContent value="sprint" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeSprint ? (
                  <>
                    <BurndownChart sprintId={activeSprint.id} />
                    <SprintReport sprintId={activeSprint.id} />
                  </>
                ) : (
                  <div className="col-span-2 p-8 text-center text-muted-foreground bg-muted/30 rounded-lg">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No active sprint</p>
                    <p className="text-sm">Start a sprint to see burndown and sprint reports</p>
                  </div>
                )}
                {boardId && <VelocityChart boardId={boardId} />}
                <ReleaseBurndown projectId={selectedProjectId} />
              </div>
            </TabsContent>

            {/* Flow Metrics */}
            <TabsContent value="flow" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeadCycleTimeChart projectId={selectedProjectId} />
                <ControlChart projectId={selectedProjectId} />
                <CumulativeFlowChart projectId={selectedProjectId} />
                <AgeingChart projectId={selectedProjectId} />
              </div>
            </TabsContent>

            {/* Team Analytics */}
            <TabsContent value="team" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamWorkloadChart projectId={selectedProjectId} />
                <ContributorPerformance projectId={selectedProjectId} />
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
