import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Star,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { ClassificationBadge } from '@/components/compliance/ClassificationBanner';
import { CreateProjectModal, useProjects, useCreateProject } from '@/features/projects';
import type { ClassificationLevel, ProjectTemplate } from '@/types/jira';

const STATS = [
  { label: 'Open Issues', value: 24, icon: AlertCircle, color: 'text-warning' },
  { label: 'In Progress', value: 8, icon: Clock, color: 'text-info' },
  { label: 'Done This Week', value: 15, icon: CheckCircle2, color: 'text-success' },
];

export default function Dashboard() {
  const { profile, isAuthenticated } = useAuth();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const navigate = useNavigate();

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createProject = useCreateProject();

  const handleCreateProject = async (data: {
    name: string;
    pkey: string;
    description?: string;
    template: 'scrum' | 'kanban' | 'basic';
    classification: ClassificationLevel;
    program_id?: string;
    workflow_scheme_id?: string;
  }) => {
    const result = await createProject.mutateAsync({
      name: data.name,
      pkey: data.pkey,
      description: data.description,
      template: data.template as ProjectTemplate,
      classification: data.classification,
      program_id: data.program_id,
      workflow_scheme_id: data.workflow_scheme_id,
    });
    navigate(`/projects/${result.pkey}/board`);
  };

  const recentProjects = projects?.slice(0, 5) || [];

  return (
    <>
      <CreateProjectModal
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        onSubmit={handleCreateProject}
      />
      <AppLayout showSidebar={false}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">
              {isAuthenticated ? `Welcome back, ${profile?.display_name || 'User'}` : 'Welcome to Jira'}
            </h1>
            <p className="text-muted-foreground mt-1">Your project management dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => setIsCreateProjectOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsCreateProjectOpen(true); } }}
              tabIndex={0}
              role="button"
              aria-label="Create Project"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Create Project</h3>
                  <p className="text-sm text-muted-foreground">Start a new project</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => navigate('/projects')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/projects'); } }}
              tabIndex={0}
              role="button"
              aria-label="View All Projects"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-medium">View All Projects</h3>
                  <p className="text-sm text-muted-foreground">Browse your projects</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-info" />
                </div>
                <div>
                  <h3 className="font-medium">Search Issues</h3>
                  <p className="text-sm text-muted-foreground">Find with JQL</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {STATS.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        <span className="text-2xl font-semibold">{stat.value}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">Recent Projects</CardTitle>
                    <CardDescription>Your recently accessed projects</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/projects">View all<ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No projects yet</p>
                      <Button variant="link" onClick={() => setIsCreateProjectOpen(true)}>
                        Create your first project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentProjects.map((project) => (
                        <Link
                          key={project.id}
                          to={`/projects/${project.pkey}/board`}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{project.name}</h4>
                              <ClassificationBadge level={project.classification as ClassificationLevel} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {project.pkey} • {project.template}
                            </p>
                          </div>
                          <Star className="h-4 w-4 text-muted-foreground hover:text-warning" />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Assigned to Me</CardTitle>
                  <CardDescription>Issues requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No issues assigned to you</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
