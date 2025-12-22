// Git Demo Mode Toggle Component
// Provides UI controls for enabling/disabling demo mode

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Beaker, Loader2, Trash2, Database, Info } from 'lucide-react';
import { useGitDemo } from '../context/GitDemoContext';

export function GitDemoToggle() {
  const { isDemoMode, isLoading, toggleDemoMode, disableDemoMode } = useGitDemo();

  return (
    <Card className="border-dashed border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Beaker className="h-5 w-5 text-primary" />
          Demo Mode
        </CardTitle>
        <CardDescription>
          Test Git integration features without connecting to a real Git provider
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="demo-mode" className="font-medium">
              Enable Demo Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Populates the database with sample Git data
            </p>
          </div>
          <Switch
            id="demo-mode"
            checked={isDemoMode}
            onCheckedChange={toggleDemoMode}
            disabled={isLoading}
          />
        </div>

        {isDemoMode && (
          <>
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertTitle>Demo mode is active</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  You now have access to demo data including:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>1 Demo GitHub Organization</li>
                  <li>1 Demo Repository linked to your project</li>
                  <li>4 Sample commits with Smart Commit messages</li>
                  <li>3 Branches (including feature branches)</li>
                  <li>2 Pull requests (1 open, 1 merged)</li>
                  <li>2 CI/CD builds (1 success, 1 running)</li>
                  <li>2 Deployments (staging & production)</li>
                </ul>
                <p className="mt-3 font-medium">
                  Go to any issue's Development panel to see the linked Git data.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDemoMode}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Refresh Demo Data
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={disableDemoMode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Clear Demo Data
              </Button>
            </div>
          </>
        )}

        {!isDemoMode && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>What demo mode does</AlertTitle>
            <AlertDescription className="mt-2">
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>Creates a demo GitHub organization (no real OAuth needed)</li>
                <li>Adds a demo repository linked to your first project</li>
                <li>Populates sample commits, branches, PRs, builds, and deployments</li>
                <li>Links demo data to your existing issues</li>
              </ol>
              <p className="mt-3 text-sm">
                <strong>Note:</strong> Actions like "Create Branch" or "Create PR" will show success
                in demo mode but won't make real API calls.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
