import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target } from 'lucide-react';
import { useState } from 'react';
import { differenceInDays, format, eachDayOfInterval, startOfDay } from 'date-fns';

interface ReleaseBurndownProps {
  projectId: string;
}

export function ReleaseBurndown({ projectId }: ReleaseBurndownProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const { data: versions } = useQuery({
    queryKey: ['versions-for-burndown', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('versions')
        .select('id, name, start_date, release_date')
        .eq('project_id', projectId)
        .eq('is_archived', false)
        .order('release_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const selectedVersion = versions?.find(v => v.id === selectedVersionId);

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['release-burndown', selectedVersionId],
    queryFn: async () => {
      if (!selectedVersion?.start_date || !selectedVersion?.release_date) {
        return [];
      }

      // Get issues for this version (mock - in real app you'd have fix_version_id)
      const { data: issues } = await supabase
        .from('issues')
        .select('story_points, status:issue_statuses(category), resolved_at')
        .eq('project_id', projectId)
        .gte('created_at', selectedVersion.start_date);

      const totalPoints = issues?.reduce((sum, i) => sum + (i.story_points || 0), 0) || 0;

      const startDate = startOfDay(new Date(selectedVersion.start_date));
      const endDate = startOfDay(new Date(selectedVersion.release_date));
      const today = startOfDay(new Date());
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const totalDays = days.length;

      return days.map((day, index) => {
        const idealRemaining = totalPoints - (totalPoints * (index / (totalDays - 1)));
        
        // Calculate actual remaining (issues resolved before this day)
        const resolvedBeforeDay = issues?.filter(i => 
          i.resolved_at && startOfDay(new Date(i.resolved_at)) <= day
        ).reduce((sum, i) => sum + (i.story_points || 0), 0) || 0;
        
        const actualRemaining = day <= today ? totalPoints - resolvedBeforeDay : null;

        return {
          date: format(day, 'MMM d'),
          ideal: Math.round(idealRemaining * 10) / 10,
          actual: actualRemaining !== null ? Math.round(actualRemaining * 10) / 10 : undefined,
        };
      });
    },
    enabled: !!selectedVersionId && !!selectedVersion?.start_date,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Release Burndown
            </CardTitle>
            <CardDescription>
              Track progress toward release completion
            </CardDescription>
          </div>
          <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select release" />
            </SelectTrigger>
            <SelectContent>
              {versions?.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {!selectedVersionId ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a release to view burndown
            </div>
          ) : isLoading ? (
            <div className="h-64 animate-pulse bg-muted rounded" />
          ) : chartData?.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for this release
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="ideal" 
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground) / 0.1)"
                  strokeDasharray="5 5"
                  name="Ideal"
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  name="Actual"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
