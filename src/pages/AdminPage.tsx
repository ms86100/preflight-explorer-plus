import { AppLayout } from '@/components/layout/AppLayout';
import { ComplianceDashboard, DataExportControls } from '@/features/compliance';
import { AuditLogsViewer, PermissionSchemesManager } from '@/features/enterprise';
import { GitIntegrationPanel } from '@/features/git-integration/components/GitIntegrationPanel';
import { StatusManager } from '@/features/statuses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, Lock, Download, GitBranch, CircleDot } from 'lucide-react';

export default function AdminPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Administration
          </h1>
          <p className="text-muted-foreground">Enterprise features, compliance, and security controls</p>
        </div>

        <Tabs defaultValue="statuses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="statuses" className="gap-2">
              <CircleDot className="h-4 w-4" />
              Statuses
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="git" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Git Integration
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Lock className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="exports" className="gap-2">
              <Download className="h-4 w-4" />
              Data Exports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statuses">
            <StatusManager />
          </TabsContent>
          <TabsContent value="compliance">
            <ComplianceDashboard />
          </TabsContent>
          <TabsContent value="git">
            <GitIntegrationPanel />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLogsViewer />
          </TabsContent>
          <TabsContent value="permissions">
            <PermissionSchemesManager />
          </TabsContent>
          <TabsContent value="exports">
            <DataExportControls />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
