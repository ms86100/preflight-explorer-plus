import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Shield, Layers, Zap } from 'lucide-react';
import { techStackData, securityFeatures, architecturePatterns } from '../data/techStackData';

export const TechStackSection: React.FC = () => {
  const categories = [...new Set(techStackData.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Technology Stack</h1>
        <p className="text-muted-foreground">
          Complete overview of technologies, security features, and architecture patterns.
        </p>
      </div>

      {/* Technology by Category */}
      {categories.map((category) => {
        const items = techStackData.filter(item => item.category === category);
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technology</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Purpose</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.version ? (
                          <Badge variant="outline" className="font-mono">
                            {item.version}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.purpose}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Features
          </CardTitle>
          <CardDescription>
            Enterprise-grade security measures implemented throughout the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{feature.feature}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium">Implementation:</span> {feature.implementation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Architecture Patterns
          </CardTitle>
          <CardDescription>
            Design patterns and architectural decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {architecturePatterns.map((pattern, index) => (
              <div key={index} className="p-4 rounded-lg border">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  {pattern.pattern}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{pattern.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {pattern.benefits.map((benefit, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Project Structure</CardTitle>
          <CardDescription>
            Feature-based modular architecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-lg bg-muted/50 text-sm font-mono overflow-x-auto">
{`src/
├── components/          # Shared UI components
│   ├── ui/             # shadcn/ui primitives
│   └── layout/         # App layout components
├── features/           # Feature modules (23+)
│   ├── projects/       # Project management
│   ├── issues/         # Issue tracking
│   ├── boards/         # Kanban/Scrum boards
│   ├── workflows/      # Workflow engine
│   ├── git-integration/# Git provider integration
│   └── ...             # Other features
├── hooks/              # Shared React hooks
├── lib/                # Utilities and helpers
├── pages/              # Route page components
├── integrations/       # External integrations
│   └── supabase/       # Supabase client & types
└── types/              # Shared TypeScript types

supabase/
├── config.toml         # Supabase configuration
├── functions/          # Edge functions
│   ├── git-api/        # Git provider API
│   ├── git-webhook/    # Webhook handler
│   └── ...             # Other functions
└── migrations/         # Database migrations`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
