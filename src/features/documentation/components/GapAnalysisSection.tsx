import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, Download, Filter } from 'lucide-react';
import { gapAnalysisData, dossierCategoryInfo } from '../data/gapAnalysis';
import { CompletionStatus, DossierCategory, DossierSummary } from '../types';

export const GapAnalysisSection: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | CompletionStatus>('all');

  const categories: DossierCategory[] = [
    'functional', 'architecture', 'technical', 'nfr', 
    'operations', 'testing', 'knowledge-transfer', 'governance'
  ];

  const summaries = useMemo(() => {
    return categories.map(category => {
      const items = gapAnalysisData.filter(item => item.category === category);
      const complete = items.filter(i => i.status === 'complete').length;
      const partial = items.filter(i => i.status === 'partial').length;
      const gap = items.filter(i => i.status === 'gap').length;
      const total = items.length;
      const completionPercentage = total > 0 ? Math.round(((complete + partial * 0.5) / total) * 100) : 0;

      return {
        category,
        title: dossierCategoryInfo[category].title,
        description: dossierCategoryInfo[category].description,
        totalItems: total,
        completeCount: complete,
        partialCount: partial,
        gapCount: gap,
        completionPercentage
      } as DossierSummary;
    });
  }, []);

  const overallStats = useMemo(() => {
    const total = gapAnalysisData.length;
    const complete = gapAnalysisData.filter(i => i.status === 'complete').length;
    const partial = gapAnalysisData.filter(i => i.status === 'partial').length;
    const gap = gapAnalysisData.filter(i => i.status === 'gap').length;
    const percentage = Math.round(((complete + partial * 0.5) / total) * 100);
    return { total, complete, partial, gap, percentage };
  }, []);

  const getStatusIcon = (status: CompletionStatus) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'gap': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'not-applicable': return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: CompletionStatus) => {
    switch (status) {
      case 'complete': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Complete</Badge>;
      case 'partial': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Partial</Badge>;
      case 'gap': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Gap</Badge>;
      case 'not-applicable': return <Badge variant="outline">N/A</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">High</Badge>;
      case 'medium': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return gapAnalysisData;
    return gapAnalysisData.filter(item => item.status === statusFilter);
  }, [statusFilter]);

  const exportToCsv = () => {
    const headers = ['Category', 'Subcategory', 'Requirement', 'Status', 'Priority', 'Evidence', 'Gap Description', 'Remediation Plan', 'Effort', 'Owner'];
    const rows = gapAnalysisData.map(item => [
      item.category,
      item.subcategory,
      item.requirement,
      item.status,
      item.priority,
      item.evidence || '',
      item.gapDescription || '',
      item.remediationPlan || '',
      item.estimatedEffort || '',
      item.owner || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gap-analysis-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Project Completion Dossier</h1>
        <p className="text-muted-foreground">
          Comprehensive 100% completion checklist across 8 dossier categories. Track gaps and remediation plans.
        </p>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Completion Status</CardTitle>
          <CardDescription>
            Definition: A project is complete when business value, system behavior, technical resilience, security, 
            operations, and knowledge ownership are fully demonstrable, documented, and transferable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Progress value={overallStats.percentage} className="flex-1 h-3" />
              <span className="text-2xl font-bold">{overallStats.percentage}%</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Complete</p>
                  <p className="text-xl font-semibold">{overallStats.complete}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Partial</p>
                  <p className="text-xl font-semibold">{overallStats.partial}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Gaps</p>
                  <p className="text-xl font-semibold">{overallStats.gap}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-xl font-semibold">{overallStats.total}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map(summary => (
          <Card key={summary.category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{summary.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={summary.completionPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{summary.completionPercentage}% complete</span>
                  <span>{summary.gapCount} gaps</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Export */}
      <div className="flex items-center justify-between">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
            <TabsTrigger value="partial">Partial</TabsTrigger>
            <TabsTrigger value="gap">Gaps Only</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={exportToCsv} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Detailed Checklist by Category */}
      <Accordion type="multiple" defaultValue={['functional']} className="space-y-4">
        {categories.map(category => {
          const categoryItems = filteredData.filter(item => item.category === category);
          const summary = summaries.find(s => s.category === category)!;
          
          if (categoryItems.length === 0) return null;

          return (
            <AccordionItem key={category} value={category} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 text-left">
                  <div>
                    <h3 className="font-semibold">{summary.title}</h3>
                    <p className="text-sm text-muted-foreground">{summary.description}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline">{summary.completionPercentage}%</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="hidden md:table-cell">Evidence / Gap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{getStatusIcon(item.status)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.requirement}</p>
                            <p className="text-xs text-muted-foreground">{item.subcategory}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs">
                          {item.evidence && (
                            <p className="text-xs text-green-600">{item.evidence}</p>
                          )}
                          {item.gapDescription && (
                            <p className="text-xs text-red-600">{item.gapDescription}</p>
                          )}
                          {item.remediationPlan && (
                            <p className="text-xs text-blue-600 mt-1">→ {item.remediationPlan}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
