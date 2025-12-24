import { AppLayout } from '@/components/layout/AppLayout';
import { ComplianceDashboard, DataExportControls } from '@/features/compliance';
import { AuditLogsViewer, AccessControlManager } from '@/features/enterprise';
import { StatusManager } from '@/features/statuses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, Download, CircleDot, Users } from 'lucide-react';

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
            <TabsTrigger value="access-control" className="gap-2">
              <Users className="h-4 w-4" />
              Access Control
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
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
          <TabsContent value="access-control">
            <AccessControlManager />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLogsViewer />
          </TabsContent>
          <TabsContent value="exports">
            <DataExportControls />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}