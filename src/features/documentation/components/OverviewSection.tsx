import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, GitBranch, Workflow, BarChart3, Users, Shield, 
  FileText, Settings, Puzzle, Database, Globe, Lock 
} from 'lucide-react';

const featureHighlights = [
  { icon: Layers, title: 'Issue Tracking', description: 'Comprehensive work item management with custom fields and workflows' },
  { icon: GitBranch, title: 'Git Integration', description: 'Connect GitHub, GitLab, or Bitbucket to track development activity' },
  { icon: Workflow, title: 'Workflow Engine', description: 'Visual workflow designer with transitions, conditions, and validators' },
  { icon: BarChart3, title: 'Reports & Analytics', description: 'Burndown charts, velocity tracking, and performance metrics' },
  { icon: Users, title: 'Team Management', description: 'Organize teams, manage permissions, and track workload' },
  { icon: Shield, title: 'Enterprise Security', description: 'RLS policies, audit logs, data classification, and LDAP integration' },
  { icon: FileText, title: 'Document Export', description: 'Generate formatted documents from issue data with templates' },
  { icon: Settings, title: 'Customization', description: 'Custom fields, plugins, and automation rules' },
  { icon: Puzzle, title: 'Plugin System', description: 'Extend functionality with a modular plugin architecture' },
  { icon: Database, title: 'Data Migration', description: 'Import from CSV and other project management tools' },
  { icon: Globe, title: 'Self-Hosted', description: 'Deploy on your own infrastructure with full data control' },
  { icon: Lock, title: 'Compliance', description: 'Data classification, export controls, and audit trails' },
];

export const OverviewSection: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <Badge variant="secondary" className="text-sm">
          Enterprise Project Management
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          Vertex PM Documentation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A comprehensive, JIRA-like project management platform built for modern development teams.
          Self-hosted, offline-capable, and enterprise-ready.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">23+</div>
            <div className="text-sm text-muted-foreground">Feature Modules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">80+</div>
            <div className="text-sm text-muted-foreground">Database Tables</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">TypeScript</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">RLS</div>
            <div className="text-sm text-muted-foreground">Secured</div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureHighlights.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="w-5 h-5 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Architecture Overview</CardTitle>
          <CardDescription>
            High-level view of the system architecture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React 18 with TypeScript</li>
                <li>• Vite for fast builds</li>
                <li>• Tailwind CSS + shadcn/ui</li>
                <li>• TanStack Query for state</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Backend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Supabase (self-hosted)</li>
                <li>• PostgreSQL database</li>
                <li>• Edge Functions (Deno)</li>
                <li>• Realtime subscriptions</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Row Level Security (RLS)</li>
                <li>• JWT authentication</li>
                <li>• LDAP integration</li>
                <li>• Audit logging</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Quick navigation guide for this documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">For Developers</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>→ <strong>Modules</strong>: Understand each feature module</li>
                <li>→ <strong>Database</strong>: Explore the schema and relationships</li>
                <li>→ <strong>Tech Stack</strong>: Learn the technologies used</li>
                <li>→ <strong>Deployment</strong>: Set up your development environment</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">For Architects</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>→ <strong>Diagrams</strong>: Visual system architecture</li>
                <li>→ <strong>Database</strong>: Entity relationships and RLS</li>
                <li>→ <strong>Tech Stack</strong>: Architecture patterns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
