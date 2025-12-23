import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/features/projects';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Zap, Plus, Trash2, CheckCircle,
  XCircle, Clock, Loader2, Settings, GitCommit,
  GitPullRequest, Rocket
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  trigger_type: string;
  trigger_config: any;
  conditions: any[];
  actions: any[];
  is_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AutomationLog {
  id: string;
  rule_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const TRIGGER_TYPES = [
  // Issue triggers
  { value: 'issue_created', label: 'Issue Created', category: 'issue' },
  { value: 'issue_updated', label: 'Issue Updated', category: 'issue' },
  { value: 'status_changed', label: 'Status Changed', category: 'issue' },
  { value: 'assignee_changed', label: 'Assignee Changed', category: 'issue' },
  { value: 'comment_added', label: 'Comment Added', category: 'issue' },
  // Git/CI triggers
  { value: 'commit_pushed', label: 'Commit Pushed', category: 'git' },
  { value: 'pull_request_opened', label: 'Pull Request Opened', category: 'git' },
  { value: 'pull_request_merged', label: 'Pull Request Merged', category: 'git' },
  { value: 'build_completed', label: 'Build Completed', category: 'git' },
  { value: 'build_failed', label: 'Build Failed', category: 'git' },
  { value: 'deployment_completed', label: 'Deployment Completed', category: 'git' },
  // Other triggers
  { value: 'scheduled', label: 'Scheduled', category: 'other' },
  { value: 'manual', label: 'Manual Trigger', category: 'other' },
];

const ACTION_TYPES = [
  { value: 'transition_issue', label: 'Transition Issue' },
  { value: 'assign_issue', label: 'Assign Issue' },
  { value: 'add_comment', label: 'Add Comment' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'set_field', label: 'Set Field Value' },
  { value: 'create_subtask', label: 'Create Subtask' },
  { value: 'link_issue', label: 'Link Issue' },
];

export default function AutomationPage() {
  const { user } = useAuth();
  const { data: projects } = useProjects();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    trigger_type: 'issue_created',
    is_enabled: true,
  });

  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules((data || []) as unknown as AutomationRule[]);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleCreateRule = async () => {
    if (!user?.id || !formData.name.trim()) {
      toast.error('Please enter a rule name');
      return;
    }

    try {
      const { error } = await supabase.from('automation_rules').insert({
        name: formData.name,
        description: formData.description || null,
        project_id: formData.project_id || null,
        trigger_type: formData.trigger_type,
        trigger_config: {},
        conditions: [],
        actions: [],
        is_enabled: formData.is_enabled,
        created_by: user.id,
      });

      if (error) throw error;
      toast.success('Automation rule created');
      setShowCreateDialog(false);
      setFormData({
        name: '',
        description: '',
        project_id: '',
        trigger_type: 'issue_created',
        is_enabled: true,
      });
      fetchRules();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
    }
  };

  const toggleRule = async (rule: AutomationRule) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_enabled: !rule.is_enabled })
        .eq('id', rule.id);

      if (error) throw error;
      toast.success(`Rule ${rule.is_enabled ? 'disabled' : 'enabled'}`);
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await supabase.from('automation_rules').delete().eq('id', ruleId);
      if (error) throw error;
      toast.success('Rule deleted');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
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
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Automation Rules
            </h1>
            <p className="text-muted-foreground">Create rules to automate repetitive tasks</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    placeholder="e.g., Auto-assign bugs to QA team"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what this rule does..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project (optional)</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All projects (global)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All projects (global)</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trigger</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Issue Events</div>
                      {TRIGGER_TYPES.filter(t => t.category === 'issue').map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Git & CI/CD Events</div>
                      {TRIGGER_TYPES.filter(t => t.category === 'git').map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          <span className="flex items-center gap-2">
                            {trigger.value.includes('commit') && <GitCommit className="h-3.5 w-3.5" />}
                            {trigger.value.includes('pull_request') && <GitPullRequest className="h-3.5 w-3.5" />}
                            {trigger.value.includes('build') && <Settings className="h-3.5 w-3.5" />}
                            {trigger.value.includes('deployment') && <Rocket className="h-3.5 w-3.5" />}
                            {trigger.label}
                          </span>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Other</div>
                      {TRIGGER_TYPES.filter(t => t.category === 'other').map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enable rule immediately</Label>
                  <Switch
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                  />
                </div>

                <Button onClick={handleCreateRule} className="w-full">
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rules">Rules ({rules.length})</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            {rules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first rule to start automating tasks
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <Card key={rule.id} className={!rule.is_enabled ? 'opacity-60' : ''}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            TRIGGER_TYPES.find((t) => t.value === rule.trigger_type)?.category === 'git'
                              ? 'bg-orange-500/10'
                              : 'bg-primary/10'
                          }`}>
                            {(() => {
                              const triggerType = rule.trigger_type;
                              if (triggerType.includes('commit')) return <GitCommit className="h-5 w-5 text-orange-500" />;
                              if (triggerType.includes('pull_request')) return <GitPullRequest className="h-5 w-5 text-orange-500" />;
                              if (triggerType.includes('build')) return <Settings className="h-5 w-5 text-orange-500" />;
                              if (triggerType.includes('deployment')) return <Rocket className="h-5 w-5 text-orange-500" />;
                              return <Zap className="h-5 w-5 text-primary" />;
                            })()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{rule.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  TRIGGER_TYPES.find((t) => t.value === rule.trigger_type)?.category === 'git'
                                    ? 'border-orange-500/50 text-orange-600'
                                    : ''
                                }`}
                              >
                                {TRIGGER_TYPES.find((t) => t.value === rule.trigger_type)?.label || rule.trigger_type}
                              </Badge>
                              {rule.project_id ? (
                                <Badge variant="secondary" className="text-xs">
                                  {projects?.find((p) => p.id === rule.project_id)?.name || 'Project'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Global</Badge>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {rule.is_enabled ? 'Active' : 'Disabled'}
                          </span>
                          <Switch
                            checked={rule.is_enabled}
                            onCheckedChange={() => toggleRule(rule)}
                          />
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            {logs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No execution logs yet</h3>
                  <p className="text-muted-foreground">
                    Logs will appear here when rules are executed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="text-sm font-medium">
                              Rule: {rules.find((r) => r.id === log.rule_id)?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.started_at), 'MMM d, yyyy h:mm:ss a')}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            log.status === 'success'
                              ? 'default'
                              : log.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      {log.error_message && (
                        <p className="text-sm text-destructive mt-2">{log.error_message}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
