import React, { useState } from 'react';
import { useSiteAccess } from '@/hooks/useSiteAccess';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, KeyRound, ArrowRight, ChevronDown, ChevronUp, CheckCircle2, Layers, GitBranch, BarChart3, Users, Workflow } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SiteAccessGateProps {
  children: React.ReactNode;
}

const features = [
  { icon: Layers, title: 'Project Management', description: 'Organize work with customizable boards, backlogs, and sprints' },
  { icon: GitBranch, title: 'Git Integration', description: 'Connect repositories, track commits, PRs, and deployments' },
  { icon: Workflow, title: 'Workflow Automation', description: 'Design custom workflows with transitions and validations' },
  { icon: BarChart3, title: 'Reports & Analytics', description: 'Burndown charts, velocity tracking, and team performance' },
  { icon: Users, title: 'Team Collaboration', description: 'Role-based access, mentions, and real-time updates' },
];

export const SiteAccessGate: React.FC<SiteAccessGateProps> = ({ children }) => {
  const { hasAccess, isLoading, validateAccess } = useSiteAccess();
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!validateAccess(accessKey)) {
      setError('Invalid access key. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vertex PM</h1>
          <p className="text-muted-foreground">Enterprise Project Management Platform</p>
        </div>

        {/* Access Form */}
        <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <KeyRound className="w-5 h-5" />
              Protected Access
            </CardTitle>
            <CardDescription>
              Enter your access key to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter access key"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="h-12 text-center text-lg tracking-widest"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
                disabled={!accessKey || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Enter Application
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Learn More Section */}
        <Collapsible open={showLearnMore} onOpenChange={setShowLearnMore}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                Learn more about this tool
                {showLearnMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="font-semibold text-lg">Enterprise-Grade Project Management</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A comprehensive JIRA-like platform built for modern development teams
                    </p>
                  </div>
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <feature.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Self-hosted • Offline capable • Enterprise security</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Contact your administrator for access credentials
        </p>
      </div>
    </div>
  );
};
