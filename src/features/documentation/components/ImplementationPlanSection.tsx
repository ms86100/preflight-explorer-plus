import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Target, Clock, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { gapAnalysisData, dossierCategoryInfo } from '../data/gapAnalysis';
import { Priority } from '../types';

interface RemediationItem {
  id: string;
  requirement: string;
  category: string;
  status: string;
  priority: Priority;
  remediationPlan: string;
  estimatedEffort: string;
  owner: string;
  phase: number;
}

export const ImplementationPlanSection: React.FC = () => {
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const remediationItems = useMemo(() => {
    return gapAnalysisData
      .filter(item => item.status !== 'complete' && item.status !== 'not-applicable')
      .map(item => {
        // Determine phase based on priority
        let phase = 3;
        if (item.priority === 'critical') phase = 1;
        else if (item.priority === 'high') phase = 2;

        return {
          id: item.id,
          requirement: item.requirement,
          category: dossierCategoryInfo[item.category].title,
          status: item.status,
          priority: item.priority,
          remediationPlan: item.remediationPlan || 'Complete implementation',
          estimatedEffort: item.estimatedEffort || 'TBD',
          owner: item.owner || 'Unassigned',
          phase
        } as RemediationItem;
      })
      .sort((a, b) => a.phase - b.phase || priorityOrder(a.priority) - priorityOrder(b.priority));
  }, []);

  const owners = useMemo(() => {
    const ownerSet = new Set(remediationItems.map(item => item.owner));
    return Array.from(ownerSet).sort();
  }, [remediationItems]);

  const filteredItems = useMemo(() => {
    if (ownerFilter === 'all') return remediationItems;
    return remediationItems.filter(item => item.owner === ownerFilter);
  }, [remediationItems, ownerFilter]);

  const phaseStats = useMemo(() => {
    return [1, 2, 3].map(phase => ({
      phase,
      count: remediationItems.filter(i => i.phase === phase).length,
      label: phase === 1 ? 'Critical Path' : phase === 2 ? 'High Priority' : 'Standard'
    }));
  }, [remediationItems]);

  const ownerStats = useMemo(() => {
    return owners.map(owner => ({
      owner,
      count: remediationItems.filter(i => i.owner === owner).length
    })).sort((a, b) => b.count - a.count);
  }, [remediationItems, owners]);

  function priorityOrder(priority: Priority): number {
    switch (priority) {
      case 'critical': return 0;
      case 'high': return 1;
      case 'medium': return 2;
      case 'low': return 3;
      default: return 4;
    }
  }

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">High</Badge>;
      case 'medium': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getPhaseBadge = (phase: number) => {
    switch (phase) {
      case 1: return <Badge variant="destructive">Phase 1</Badge>;
      case 2: return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Phase 2</Badge>;
      case 3: return <Badge variant="secondary">Phase 3</Badge>;
      default: return <Badge variant="outline">TBD</Badge>;
    }
  };

  const totalItems = remediationItems.length;
  const totalEffort = remediationItems.reduce((acc, item) => {
    const match = item.estimatedEffort.match(/(\d+)/);
    return acc + (match ? parseInt(match[1]) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Implementation Plan</h1>
        <p className="text-muted-foreground">
          Prioritized remediation roadmap for all identified gaps. Items are organized by phase and priority.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalItems}</p>
            <p className="text-xs text-muted-foreground">remediation tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Est. Total Effort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalEffort}+</p>
            <p className="text-xs text-muted-foreground">person-days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{phaseStats[0].count}</p>
            <p className="text-xs text-muted-foreground">require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams Involved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{owners.length}</p>
            <p className="text-xs text-muted-foreground">owner groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Phase Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Breakdown</CardTitle>
          <CardDescription>Implementation timeline organized by priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {phaseStats.map(stat => (
              <div key={stat.phase} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Phase {stat.phase}: {stat.label}</h4>
                  {getPhaseBadge(stat.phase)}
                </div>
                <p className="text-2xl font-bold">{stat.count} items</p>
                <Progress 
                  value={(stat.count / totalItems) * 100} 
                  className="h-2 mt-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Owner Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Workload Distribution</CardTitle>
          <CardDescription>Tasks assigned per team/role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ownerStats.map(stat => (
              <Badge 
                key={stat.owner}
                variant="outline"
                className="text-sm py-1.5 px-3 cursor-pointer hover:bg-muted"
                onClick={() => setOwnerFilter(stat.owner === ownerFilter ? 'all' : stat.owner)}
              >
                {stat.owner}: {stat.count}
                {stat.owner === ownerFilter && <CheckCircle2 className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
            {ownerFilter !== 'all' && (
              <Badge 
                variant="secondary"
                className="text-sm py-1.5 px-3 cursor-pointer"
                onClick={() => setOwnerFilter('all')}
              >
                Clear filter
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={ownerFilter} onValueChange={setOwnerFilter}>
        <TabsList>
          <TabsTrigger value="all">All Owners</TabsTrigger>
          {owners.slice(0, 6).map(owner => (
            <TabsTrigger key={owner} value={owner}>{owner}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Remediation Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Remediation Tasks</CardTitle>
          <CardDescription>
            {filteredItems.length} of {totalItems} tasks
            {ownerFilter !== 'all' && ` (filtered by ${ownerFilter})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="hidden lg:table-cell">Remediation Plan</TableHead>
                <TableHead>Effort</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{getPhaseBadge(item.phase)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{item.requirement}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{item.category}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{item.category}</span>
                  </TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">{item.remediationPlan}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.estimatedEffort}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.owner}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
              <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Phase 1: Critical Path (Weeks 1-2)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Security approvals and pen testing</li>
                <li>• OWASP Top 10 audit</li>
                <li>• Go-live certification process</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
              <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Phase 2: High Priority (Weeks 3-6)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Performance and load testing</li>
                <li>• Incident response playbooks</li>
                <li>• Accessibility compliance</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
              <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Phase 3: Standard (Weeks 7-10)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Documentation enhancements</li>
                <li>• API versioning strategy</li>
                <li>• Monitoring and observability</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
