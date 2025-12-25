import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Terminal, AlertTriangle, CheckCircle2, Clock, Server } from 'lucide-react';
import { deploymentGuide } from '../data/deploymentGuide';

export const DeploymentSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Deployment Guide</h1>
        <p className="text-muted-foreground">
          Complete guide for local development, production deployment, and maintenance.
        </p>
      </div>

      {/* Local Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            {deploymentGuide.localSetup.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {deploymentGuide.localSetup.steps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-sm font-mono overflow-x-auto">
                    {step.commands.join('\n')}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>{deploymentGuide.environmentVariables.title}</CardTitle>
          <CardDescription>Required and optional environment configuration</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deploymentGuide.environmentVariables.variables.map((variable) => (
                <TableRow key={variable.name}>
                  <TableCell className="font-mono text-sm">{variable.name}</TableCell>
                  <TableCell>
                    {variable.required ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {variable.description}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {variable.example}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Production Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            {deploymentGuide.productionDeployment.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lovable">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lovable">Lovable Hosting</TabsTrigger>
              <TabsTrigger value="docker">Self-Hosted Docker</TabsTrigger>
              <TabsTrigger value="static">Static Hosting</TabsTrigger>
            </TabsList>
            {deploymentGuide.productionDeployment.options.map((option) => (
              <TabsContent 
                key={option.name.toLowerCase().replace(/\s+/g, '-')} 
                value={option.name.toLowerCase().split(' ')[0].replace('-', '')}
                className="mt-4"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  <ol className="space-y-2">
                    {option.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Supabase Setup */}
      <Card>
        <CardHeader>
          <CardTitle>{deploymentGuide.supabaseSetup.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {deploymentGuide.supabaseSetup.steps.map((section, index) => (
              <div key={index} className="p-4 rounded-lg border">
                <h4 className="font-medium mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {deploymentGuide.troubleshooting.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentGuide.troubleshooting.issues.map((issue, index) => (
              <div key={index} className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium text-destructive">{issue.problem}</h4>
                <p className="text-sm text-muted-foreground mt-2">{issue.solution}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {deploymentGuide.maintenance.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deploymentGuide.maintenance.tasks.map((task) => (
                <TableRow key={task.task}>
                  <TableCell className="font-medium">{task.task}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.frequency}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {task.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
