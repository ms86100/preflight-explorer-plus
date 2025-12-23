import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  X,
  Save,
  ArrowUpDown,
  Loader2,
  Bug,
  CheckSquare,
  Bookmark,
  Zap,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import { CreateIssueModal, IssueDetailModal, useIssuesByProject, useIssueTypes, usePriorities, useStatuses } from '@/features/issues';
import { useProjects } from '@/features/projects';
import { toast } from 'sonner';
import type { ClassificationLevel } from '@/types/jira';

const ISSUE_TYPE_ICONS: Record<string, typeof Bug> = {
  Epic: Zap,
  Story: Bookmark,
  Task: CheckSquare,
  Bug: Bug,
  'Sub-task': Layers,
};

interface JQLFilter {
  project?: string;
  issueType?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  text?: string;
}

export function IssueSearchView() {
  const { projectKey } = useParams<{ projectKey?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [jqlQuery, setJqlQuery] = useState('');
  const [filters, setFilters] = useState<JQLFilter>({
    project: projectKey,
  });
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { data: projects } = useProjects();
  const { data: issueTypes } = useIssueTypes();
  const { data: priorities } = usePriorities();
  const { data: statuses } = useStatuses();

  // Get issues from selected project or all projects
  const selectedProject = projects?.find(p => p.pkey === filters.project);
  const { data: issues, isLoading } = useIssuesByProject(selectedProject?.id || '');

  const createRequested = new URLSearchParams(location.search).get('create') === '1';

  const clearCreateQueryParam = () => {
    const params = new URLSearchParams(location.search);
    if (!params.has('create')) return;

    params.delete('create');
    const nextSearch = params.toString();
    navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
  };

  useEffect(() => {
    if (!createRequested || isCreateIssueOpen) return;

    // Prevent repeated re-opening from a persistent ?create=1 in the URL
    clearCreateQueryParam();

    if (selectedProject?.id) {
      setIsCreateIssueOpen(true);
      return;
    }

    if (projects?.length === 1) {
      setFilters((prev) => ({ ...prev, project: projects[0].pkey }));
      setIsCreateIssueOpen(true);
      return;
    }

    toast.message('Select a project to create an issue.');
  }, [
    createRequested,
    isCreateIssueOpen,
    projects,
    selectedProject?.id,
    location.pathname,
    location.search,
    navigate,
  ]);

  // Apply filters
  const filteredIssues = useMemo(() => {
    if (!issues) return [];

    return issues.filter(issue => {
      if (filters.issueType && issue.issue_type?.name !== filters.issueType) return false;
      if (filters.status && issue.status?.name !== filters.status) return false;
      if (filters.priority && issue.priority?.name !== filters.priority) return false;
      if (filters.text) {
        const searchLower = filters.text.toLowerCase();
        if (
          !issue.summary.toLowerCase().includes(searchLower) &&
          !issue.issue_key.toLowerCase().includes(searchLower) &&
          !(issue.description || '').toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [issues, filters]);

  // Sort issues
  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'issue_key':
          comparison = a.issue_key.localeCompare(b.issue_key);
          break;
        case 'summary':
          comparison = a.summary.localeCompare(b.summary);
          break;
        case 'status':
          comparison = (a.status?.name || '').localeCompare(b.status?.name || '');
          break;
        case 'priority':
          comparison = (a.priority?.name || '').localeCompare(b.priority?.name || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredIssues, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({ project: projectKey });
    setJqlQuery('');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length - (filters.project ? 1 : 0);

  return (
    <>
      <CreateIssueModal
        projectId={selectedProject?.id || ''}
        open={isCreateIssueOpen}
        onOpenChange={setIsCreateIssueOpen}
      />

      <IssueDetailModal
        issueId={selectedIssueId}
        open={!!selectedIssueId}
        onOpenChange={(open) => !open && setSelectedIssueId(null)}
      />

      <AppLayout showSidebar={!!projectKey} projectKey={projectKey}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border bg-background">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold">Issue Search</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Filter
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!selectedProject?.id) {
                      toast.error('Select a project first to create an issue.');
                      return;
                    }
                    setIsCreateIssueOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Issue
                </Button>
              </div>
            </div>

            {/* JQL Bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues or enter JQL query..."
                  value={jqlQuery || filters.text || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, text: e.target.value }))}
                  className="pl-9 font-mono text-sm"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Advanced
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={filters.project || ''}
                onValueChange={(v) => setFilters(prev => ({ ...prev, project: v || undefined }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.pkey}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.issueType || ''}
                onValueChange={(v) => setFilters(prev => ({ ...prev, issueType: v || undefined }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes?.map(type => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status || ''}
                onValueChange={(v) => setFilters(prev => ({ ...prev, status: v || undefined }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses?.map(status => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.priority || ''}
                onValueChange={(v) => setFilters(prev => ({ ...prev, priority: v || undefined }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities?.map(priority => (
                    <SelectItem key={priority.id} value={priority.name}>
                      {priority.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sortedIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-50" />
                <p>No issues found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">T</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center w-full cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('issue_key')}
                        aria-label="Sort by Key"
                      >
                        Key
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center w-full cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('summary')}
                        aria-label="Sort by Summary"
                      >
                        Summary
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </button>
                    </TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center w-full cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('status')}
                        aria-label="Sort by Status"
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center w-full cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('priority')}
                        aria-label="Sort by Priority"
                      >
                        P
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </button>
                    </TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="flex items-center w-full cursor-pointer hover:text-foreground"
                        onClick={() => handleSort('updated_at')}
                        aria-label="Sort by Updated"
                      >
                        Updated
                        <ArrowUpDown className="h-3 w-3 ml-1" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedIssues.map(issue => {
                    const TypeIcon = issue.issue_type?.name 
                      ? ISSUE_TYPE_ICONS[issue.issue_type.name] || CheckSquare 
                      : CheckSquare;
                    const initials = issue.assignee?.display_name
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '';

                    return (
                      <TableRow
                        key={issue.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedIssueId(issue.id)}
                      >
                        <TableCell>
                          <div
                            className="p-1 rounded w-fit"
                            style={{ backgroundColor: `${issue.issue_type?.color}20` }}
                          >
                            <TypeIcon
                              className="h-4 w-4"
                              style={{ color: issue.issue_type?.color }}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {issue.issue_key}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {issue.summary}
                        </TableCell>
                        <TableCell>
                          <ClassificationBadge level={issue.classification as ClassificationLevel} />
                        </TableCell>
                        <TableCell>
                          <span className={`lozenge text-xs ${
                            issue.status?.category === 'done' ? 'lozenge-success' :
                            issue.status?.category === 'in_progress' ? 'lozenge-inprogress' :
                            'lozenge-default'
                          }`}>
                            {issue.status?.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {issue.priority && (
                            <span
                              className="text-sm"
                              style={{ color: issue.priority.color }}
                              title={issue.priority.name}
                            >
                              {issue.priority.name === 'Highest' ? '⬆⬆' :
                               issue.priority.name === 'High' ? '⬆' :
                               issue.priority.name === 'Medium' ? '=' :
                               issue.priority.name === 'Low' ? '⬇' : '⬇⬇'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {issue.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={issue.assignee.avatar_url || ''} alt={`${issue.assignee.display_name} avatar`} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate max-w-[100px]">
                                {issue.assignee.display_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(issue.updated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border bg-muted/30 text-sm text-muted-foreground">
            {sortedIssues.length} issue{sortedIssues.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </AppLayout>
    </>
  );
}
