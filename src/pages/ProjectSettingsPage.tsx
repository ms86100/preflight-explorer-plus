import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Settings, Save, Users, Shield, Workflow, Archive, 
  AlertTriangle, Trash2, ArrowLeft, UsersRound 
} from 'lucide-react';
import { TeamManager } from '@/features/teams';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ClassificationLevel = Database['public']['Enums']['classification_level'];
type ProjectTemplate = Database['public']['Enums']['project_template'];
type ProjectType = Database['public']['Enums']['project_type'];

const CLASSIFICATION_LEVELS: ClassificationLevel[] = ['public', 'restricted', 'confidential', 'export_controlled'];
const PROJECT_TEMPLATES: ProjectTemplate[] = ['scrum', 'kanban', 'basic', 'project_management', 'task_management', 'process_management'];
const PROJECT_TYPES: ProjectType[] = ['software', 'business'];

export default function ProjectSettingsPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pkey: '',
    project_type: 'software' as ProjectType,
    template: 'scrum' as ProjectTemplate,
    classification: 'restricted' as ClassificationLevel,
    url: '',
  });

  useEffect(() => {
    if (projectKey) {
      fetchProject();
    }
  }, [projectKey]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('pkey', projectKey)
        .single();

      if (error) throw error;

      setProject(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        pkey: data.pkey,
        project_type: data.project_type as ProjectType,
        template: data.template as ProjectTemplate,
        classification: data.classification as ClassificationLevel,
        url: data.url || '',
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          project_type: formData.project_type,
          template: formData.template,
          classification: formData.classification,
          url: formData.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;
      toast.success('Project settings saved');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!project?.id) return;

    if (!confirm('Are you sure you want to archive this project? This action can be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', project.id);

      if (error) throw error;
      toast.success('Project archived');
      navigate('/projects');
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project');
    }
  };

  const getClassificationColor = (level: ClassificationLevel) => {
    switch (level) {
      case 'public': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'restricted': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'confidential': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'export_controlled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Project Settings
            </h1>
            <p className="text-muted-foreground">Configure {project?.name}</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="access">Access & Security</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Basic information about your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pkey">Project Key</Label>
                    <Input
                      id="pkey"
                      value={formData.pkey}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Project key cannot be changed after creation
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your project..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="project_type">Project Type</Label>
                    <Select
                      value={formData.project_type}
                      onValueChange={(value) => setFormData({ ...formData, project_type: value as ProjectType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Project Template</Label>
                    <Select
                      value={formData.template}
                      onValueChange={(value) => setFormData({ ...formData, template: value as ProjectTemplate })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TEMPLATES.map((template) => (
                          <SelectItem key={template} value={template}>
                            {template.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">Project URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 rounded-lg border bg-card text-center">
                    <p className="text-2xl font-bold">{project?.issue_counter || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Issues</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card text-center">
                    <p className="text-2xl font-bold">
                      {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Created</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card text-center">
                    <p className="text-2xl font-bold">
                      {project?.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card text-center">
                    <Badge variant={project?.is_archived ? 'secondary' : 'default'}>
                      {project?.is_archived ? 'Archived' : 'Active'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5" />
                  Project Teams
                </CardTitle>
                <CardDescription>
                  Create and manage teams for this project. Only project admins can manage teams.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project?.id && <TeamManager projectId={project.id} />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Classification
                </CardTitle>
                <CardDescription>Set the security level for this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Classification Level</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {CLASSIFICATION_LEVELS.map((level) => (
                      <div
                        key={level}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          formData.classification === level
                            ? getClassificationColor(level) + ' border-2'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setFormData({ ...formData, classification: level })}
                      >
                        <p className="font-medium capitalize">{level.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {level === 'public' && 'Visible to all users'}
                          {level === 'restricted' && 'Limited to project members'}
                          {level === 'confidential' && 'Requires elevated clearance'}
                          {level === 'export_controlled' && 'Highest security level'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Access
                </CardTitle>
                <CardDescription>Manage who can access this project</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Team management is available in the Admin panel. Project leads and administrators
                  can add or remove team members.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
                  Manage Team
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Workflow Configuration
                </CardTitle>
                <CardDescription>Configure issue workflows for this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="font-medium">Current Workflow Scheme</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Default Workflow Scheme
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    This project uses the default workflow which controls issue status transitions.
                    Only transitions defined in the workflow are allowed.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/workflows')}>
                    <Workflow className="h-4 w-4 mr-2" />
                    Edit Workflows
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-4">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Archive className="h-4 w-4" />
                      Archive Project
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Hide this project from the main view. Can be restored later.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleArchive}>
                    Archive
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
                  <div>
                    <p className="font-medium flex items-center gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this project and all its data. This cannot be undone.
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
