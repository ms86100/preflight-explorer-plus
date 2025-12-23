import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { useProject } from '@/features/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { 
  Plus, 
  Tag, 
  CalendarIcon, 
  MoreHorizontal, 
  CheckCircle2, 
  Archive, 
  Trash2,
  Rocket,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Version {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly start_date: string | null;
  readonly release_date: string | null;
  readonly is_released: boolean;
  readonly is_archived: boolean;
  readonly project_id: string;
}

export default function ReleasesPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const { data: project } = useProject(projectKey || '');
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({
    name: '',
    description: '',
    startDate: undefined as Date | undefined,
    releaseDate: undefined as Date | undefined,
  });

  const { data: versions, isLoading } = useQuery({
    queryKey: ['versions', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from('versions')
        .select('*')
        .eq('project_id', project.id)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as Version[];
    },
    enabled: !!project?.id,
  });

  // Get issue counts per version (mock for now as we'd need a fix_version field)
  const { data: issueCounts } = useQuery({
    queryKey: ['version-issues', project?.id],
    queryFn: async () => {
      if (!project?.id) return {};
      // In a real implementation, you'd query issues by fix_version_id
      // For now, return mock data
      const counts: Record<string, { total: number; done: number }> = {};
      (versions || []).forEach(v => {
        counts[v.id] = { total: Math.floor(Math.random() * 20) + 5, done: Math.floor(Math.random() * 15) };
      });
      return counts;
    },
    enabled: !!project?.id && !!versions,
  });

  const createVersion = useMutation({
    mutationFn: async () => {
      if (!project?.id) throw new Error('No project');
      const { error } = await supabase.from('versions').insert({
        project_id: project.id,
        name: newVersion.name,
        description: newVersion.description || null,
        start_date: newVersion.startDate?.toISOString() || null,
        release_date: newVersion.releaseDate?.toISOString() || null,
        position: (versions?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      setIsCreateOpen(false);
      setNewVersion({ name: '', description: '', startDate: undefined, releaseDate: undefined });
      toast.success('Version created');
    },
    onError: () => toast.error('Failed to create version'),
  });

  const releaseVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('versions')
        .update({ is_released: true })
        .eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      toast.success('Version released!');
    },
  });

  const archiveVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('versions')
        .update({ is_archived: true })
        .eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      toast.success('Version archived');
    },
  });

  const deleteVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase.from('versions').delete().eq('id', versionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] });
      toast.success('Version deleted');
    },
  });

  const activeVersions = versions?.filter(v => !v.is_archived && !v.is_released) || [];
  const releasedVersions = versions?.filter(v => v.is_released && !v.is_archived) || [];
  const archivedVersions = versions?.filter(v => v.is_archived) || [];

  const getVersionStatus = (version: Version) => {
    if (version.is_released) return { label: 'Released', variant: 'default' as const, icon: CheckCircle2 };
    if (version.is_archived) return { label: 'Archived', variant: 'secondary' as const, icon: Archive };
    if (version.release_date && new Date(version.release_date) < new Date()) {
      return { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle };
    }
    return { label: 'Unreleased', variant: 'outline' as const, icon: Clock };
  };

  const renderVersionCard = (version: Version) => {
    const status = getVersionStatus(version);
    const StatusIcon = status.icon;
    const counts = issueCounts?.[version.id] || { total: 0, done: 0 };
    const progress = counts.total > 0 ? (counts.done / counts.total) * 100 : 0;

    return (
      <Card key={version.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                {version.name}
              </CardTitle>
              {version.description && (
                <CardDescription>{version.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!version.is_released && (
                    <DropdownMenuItem onClick={() => releaseVersion.mutate(version.id)}>
                      <Rocket className="h-4 w-4 mr-2" />
                      Release
                    </DropdownMenuItem>
                  )}
                  {!version.is_archived && (
                    <DropdownMenuItem onClick={() => archiveVersion.mutate(version.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => deleteVersion.mutate(version.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {version.start_date && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Start: {format(new Date(version.start_date), 'MMM d, yyyy')}
                </span>
              )}
              {version.release_date && (
                <span className="flex items-center gap-1">
                  <Rocket className="h-3 w-3" />
                  Release: {format(new Date(version.release_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{counts.done} of {counts.total} issues done</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <AppLayout showSidebar projectKey={projectKey}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar projectKey={projectKey}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Releases
            </h1>
            <p className="text-muted-foreground">Manage versions and releases for {project?.name}</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Version
          </Button>
        </div>

        {/* Unreleased Versions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Unreleased</h2>
          {activeVersions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No unreleased versions</p>
                <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                  Create your first version
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeVersions.map(renderVersionCard)}
            </div>
          )}
        </div>

        {/* Released Versions */}
        {releasedVersions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Released</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {releasedVersions.map(renderVersionCard)}
            </div>
          </div>
        )}

        {/* Archived Versions */}
        {archivedVersions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">Archived</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
              {archivedVersions.map(renderVersionCard)}
            </div>
          </div>
        )}
      </div>

      {/* Create Version Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Name</Label>
              <Input
                id="version-name"
                placeholder="e.g., v1.0.0"
                value={newVersion.name}
                onChange={(e) => setNewVersion(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version-description">Description</Label>
              <Textarea
                id="version-description"
                placeholder="What's in this release?"
                value={newVersion.description}
                onChange={(e) => setNewVersion(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version-start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="version-start-date" variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {newVersion.startDate ? format(newVersion.startDate, 'MMM d, yyyy') : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newVersion.startDate}
                      onSelect={(date) => setNewVersion(prev => ({ ...prev, startDate: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version-release-date">Release Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="version-release-date" variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {newVersion.releaseDate ? format(newVersion.releaseDate, 'MMM d, yyyy') : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newVersion.releaseDate}
                      onSelect={(date) => setNewVersion(prev => ({ ...prev, releaseDate: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createVersion.mutate()} disabled={!newVersion.name}>
              Create Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
