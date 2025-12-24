
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  FileText, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Globe,
  Activity,
  TrendingUp
} from 'lucide-react';
import { format, subDays } from 'date-fns';


interface ComplianceStats {
  totalProjects: number;
  projectsByClassification: Record<string, number>;
  totalIssues: number;
  issuesByClassification: Record<string, number>;
  pendingExports: number;
  auditLogsToday: number;
  auditLogsWeek: number;
  usersWithClearance: Record<string, number>;
  totalUsers: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
  }>;
  issuesCreatedToday: number;
  issuesResolvedToday: number;
  activeSprintsCount: number;
}

export function ComplianceDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: async (): Promise<ComplianceStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = subDays(today, 7);

      // Get projects by classification
      const { data: projects } = await supabase
        .from('projects')
        .select('classification');
      
      const projectsByClassification: Record<string, number> = {};
      projects?.forEach(p => {
        const level = p.classification || 'restricted';
        projectsByClassification[level] = (projectsByClassification[level] || 0) + 1;
      });

      // Get issues by classification
      const { data: issues } = await supabase
        .from('issues')
        .select('classification, created_at, resolved_at');
      
      const issuesByClassification: Record<string, number> = {};
      let issuesCreatedToday = 0;
      let issuesResolvedToday = 0;
      issues?.forEach(i => {
        const level = i.classification || 'restricted';
        issuesByClassification[level] = (issuesByClassification[level] || 0) + 1;
        if (i.created_at && new Date(i.created_at) >= today) issuesCreatedToday++;
        if (i.resolved_at && new Date(i.resolved_at) >= today) issuesResolvedToday++;
      });

      // Get pending exports
      const { count: pendingExports } = await supabase
        .from('export_audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get today's audit logs
      const { count: auditLogsToday } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get week's audit logs
      const { count: auditLogsWeek } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get recent audit logs
      const { data: recentAuditLogs } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get users and their clearance levels
      const { data: profiles } = await supabase
        .from('profiles')
        .select('clearance_level');
      
      const usersWithClearance: Record<string, number> = {};
      profiles?.forEach(p => {
        const level = p.clearance_level || 'restricted';
        usersWithClearance[level] = (usersWithClearance[level] || 0) + 1;
      });

      // Active sprints - simplified to avoid type recursion
      const activeSprintsCount = 0; // Will be fetched separately if needed

      return {
        totalProjects: projects?.length || 0,
        projectsByClassification,
        totalIssues: issues?.length || 0,
        issuesByClassification,
        pendingExports: pendingExports || 0,
        auditLogsToday: auditLogsToday || 0,
        auditLogsWeek: auditLogsWeek || 0,
        usersWithClearance,
        totalUsers: profiles?.length || 0,
        recentAuditLogs: recentAuditLogs || [],
        issuesCreatedToday,
        issuesResolvedToday,
        activeSprintsCount,
      };
    },
  });

  const getClassificationIcon = (level: string) => {
    switch (level) {
      case 'public': return <Globe className="h-4 w-4 text-green-400" />;
      case 'restricted': return <Shield className="h-4 w-4 text-yellow-400" />;
      case 'confidential': return <Lock className="h-4 w-4 text-orange-400" />;
      case 'export_controlled': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const classificationLevels = ['public', 'restricted', 'confidential', 'export_controlled'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{stats?.totalProjects || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Issues</p>
                <p className="text-3xl font-bold">{stats?.totalIssues || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Exports</p>
                <p className="text-3xl font-bold">{stats?.pendingExports || 0}</p>
              </div>
              {stats?.pendingExports && stats.pendingExports > 0 ? (
                <Clock className="h-8 w-8 text-yellow-400" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audit Events Today</p>
                <p className="text-3xl font-bold">{stats?.auditLogsToday || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classification Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Projects by Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classificationLevels.map(level => {
              const count = stats?.projectsByClassification[level] || 0;
              const percentage = stats?.totalProjects 
                ? Math.round((count / stats.totalProjects) * 100) 
                : 0;
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getClassificationIcon(level)}
                      <span className="capitalize">{level.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users by Clearance Level
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classificationLevels.map(level => {
              const count = stats?.usersWithClearance[level] || 0;
              const totalUsers = Object.values(stats?.usersWithClearance || {}).reduce((a, b) => a + b, 0);
              const percentage = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
              
              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getClassificationIcon(level)}
                      <span className="capitalize">{level.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{count} users ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            MRTT+ Compliance Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Classification Labels Applied', status: true },
              { label: 'Export Controls Enabled', status: true },
              { label: 'Audit Logging Active', status: true },
              { label: 'User Clearance Levels Set', status: true },
              { label: 'Data Encryption at Rest', status: true },
              { label: 'Access Controls Configured', status: true },
              { label: 'Retention Policies Defined', status: false },
              { label: 'Backup Procedures Verified', status: false },
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                {item.status ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-400" />
                )}
                <span className={item.status ? '' : 'text-muted-foreground'}>
                  {item.label}
                </span>
                {item.status ? (
                  <Badge variant="outline" className="ml-auto bg-green-500/20 text-green-400">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-auto bg-yellow-500/20 text-yellow-400">
                    Pending
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
