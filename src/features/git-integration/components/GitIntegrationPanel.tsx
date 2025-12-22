import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, Link as LinkIcon, Webhook, HelpCircle, Users, Beaker } from 'lucide-react';
import { GitOrganizationForm } from './GitOrganizationForm';
import { GitOrganizationsList } from './GitOrganizationsList';
import { RepositoryLinker } from './RepositoryLinker';
import { GitUserMappingManager } from './GitUserMappingManager';
import { GitDemoToggle } from './GitDemoToggle';
import { GitDemoProvider } from '../context/GitDemoContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export function GitIntegrationPanel() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

  return (
    <GitDemoProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Git Integration
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect GitLab, GitHub, or Bitbucket to link commits, branches, and pull requests to issues.
            </p>
          </div>
        </div>

        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="providers" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="repositories" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Repositories
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              User Mapping
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-2">
              <Beaker className="h-4 w-4" />
              Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <div className="flex justify-end">
              <GitOrganizationForm />
            </div>
            <GitOrganizationsList />
          </TabsContent>

          <TabsContent value="repositories" className="space-y-4">
            <RepositoryLinker />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Configuration
                </CardTitle>
                <CardDescription>
                  Configure webhooks in your Git provider to send events to this application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>How to set up webhooks</AlertTitle>
                  <AlertDescription className="mt-2 space-y-3">
                    <p>
                      After connecting a Git provider, you need to configure webhooks in your Git platform
                      to send events to this application.
                    </p>
                    <div className="space-y-2">
                      <p className="font-medium">Webhook URL format:</p>
                      <code className="block p-2 bg-muted rounded text-sm break-all">
                        {supabaseUrl}/functions/v1/git-webhook/{'{provider}'}/{'{organization_id}'}
                      </code>
                      <p className="text-sm text-muted-foreground">
                        Replace <code>{'{provider}'}</code> with gitlab, github, or bitbucket.
                        <br />
                        Replace <code>{'{organization_id}'}</code> with the ID from your connected provider.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">🦊 GitLab</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <p><strong>Location:</strong> Project → Settings → Webhooks</p>
                      <p><strong>Events:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Push events</li>
                        <li>Merge request events</li>
                        <li>Pipeline events</li>
                        <li>Deployment events</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">🐙 GitHub</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <p><strong>Location:</strong> Repository → Settings → Webhooks</p>
                      <p><strong>Events:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Pushes</li>
                        <li>Pull requests</li>
                        <li>Workflow runs</li>
                        <li>Deployments</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">🪣 Bitbucket</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <p><strong>Location:</strong> Repository → Settings → Webhooks</p>
                      <p><strong>Events:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Repository push</li>
                        <li>Pull request created/updated/merged</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <AlertTitle>Smart Commits</AlertTitle>
                  <AlertDescription className="mt-2 space-y-2">
                    <p>
                      When enabled, commit messages can trigger actions on issues:
                    </p>
                    <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
                      <li><code>PROJ-123 #comment Fixed the bug</code> - Adds a comment</li>
                      <li><code>PROJ-123 #time 2h30m</code> - Logs work time</li>
                      <li><code>PROJ-123 #resolve</code> - Transitions to Done</li>
                      <li><code>PROJ-123 #in-progress</code> - Transitions to In Progress</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <GitUserMappingManager />
          </TabsContent>

          <TabsContent value="demo" className="space-y-4">
            <GitDemoToggle />
          </TabsContent>
        </Tabs>
      </div>
    </GitDemoProvider>
  );
}
