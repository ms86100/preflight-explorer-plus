import React, { useState, useEffect, useId } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Folder, Code, Settings, Users, GitBranch, Image, AlertCircle } from 'lucide-react';
import { moduleDocumentation } from '../data/moduleDocumentation';
import { diagramsData } from '../data/diagramsData';

// Initialize mermaid for inline diagrams
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: { htmlLabels: false, curve: 'basis' },
});

interface InlineMermaidDiagramProps {
  code: string;
  diagramId: string;
}

const InlineMermaidDiagram: React.FC<InlineMermaidDiagramProps> = ({ code, diagramId }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const uniqueId = useId().replace(/:/g, '');

  useEffect(() => {
    let mounted = true;
    
    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const cleanedCode = code.replace(/<br\/>/g, '\\n').replace(/<br>/g, '\\n');
        const id = `inline-mermaid-${diagramId}-${uniqueId}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleanedCode);
        
        if (mounted) {
          setSvg(renderedSvg);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError('Diagram unavailable');
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(renderDiagram, 100);
    return () => { mounted = false; clearTimeout(timer); };
  }, [code, diagramId, uniqueId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px] bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[100px] bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="text-center p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-lg p-3 overflow-auto max-h-[300px]"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const ModulesSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredModules = moduleDocumentation.filter(
    module =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModuleDiagrams = (diagramIds: string[] = []) => {
    return diagramsData.filter(d => diagramIds.includes(d.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Feature Modules</h1>
        <p className="text-muted-foreground">
          Complete documentation of all {moduleDocumentation.length} feature modules in the application.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Module Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Folder className="w-4 h-4" />
        <span>Showing {filteredModules.length} of {moduleDocumentation.length} modules</span>
      </div>

      {/* Module List */}
      <Accordion type="single" collapsible className="space-y-4">
        {filteredModules.map((module) => {
          const moduleDiagrams = getModuleDiagrams(module.associatedDiagrams);
          
          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Folder className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{module.name}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                  {moduleDiagrams.length > 0 && (
                    <Badge variant="outline" className="ml-auto mr-2 gap-1">
                      <GitBranch className="h-3 w-3" />
                      {moduleDiagrams.length} diagram{moduleDiagrams.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                {/* Visual Diagrams - Now at the top! */}
                {moduleDiagrams.length > 0 && (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Visual Diagrams
                      </CardTitle>
                      <CardDescription>
                        Architecture and flow diagrams related to this module
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {moduleDiagrams.map((diagram) => (
                          <div key={diagram.id} className="border rounded-lg overflow-hidden">
                            <div className="p-3 bg-muted/30 border-b flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-sm">{diagram.title}</h4>
                                <p className="text-xs text-muted-foreground">{diagram.description}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {diagram.type}
                              </Badge>
                            </div>
                            <InlineMermaidDiagram 
                              code={diagram.mermaidCode} 
                              diagramId={`${module.id}-${diagram.id}`} 
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Purpose */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Purpose & Business Intent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{module.purpose}</p>
                  </CardContent>
                </Card>

                {/* File Structure */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      File Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">Components</h4>
                        {module.components.length > 0 ? (
                          <ul className="space-y-1 text-muted-foreground">
                            {module.components.map((comp, i) => (
                              <li key={i} className="font-mono text-xs">{comp}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic">No components</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Hooks</h4>
                        {module.hooks.length > 0 ? (
                          <ul className="space-y-1 text-muted-foreground">
                            {module.hooks.map((hook, i) => (
                              <li key={i} className="font-mono text-xs">{hook}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic">No hooks</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Services</h4>
                        {module.services.length > 0 ? (
                          <ul className="space-y-1 text-muted-foreground">
                            {module.services.map((svc, i) => (
                              <li key={i} className="font-mono text-xs">{svc}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic">No services</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Flow */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">User Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {module.userFlow.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                {/* Role-Based Behavior */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Role-Based Behavior
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Role</TableHead>
                          <TableHead>Capabilities</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Badge variant="default">Admin</Badge>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {module.roles.admin.map((cap, i) => (
                                <li key={i}>{cap}</li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge variant="secondary">User</Badge>
                          </TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {module.roles.user.map((cap, i) => (
                                <li key={i}>{cap}</li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Conditions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Preconditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {module.preconditions.map((pre, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-yellow-500">•</span>
                            {pre}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Postconditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {module.postconditions.map((post, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {post}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Edge Cases */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Edge Cases & Error Handling
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {module.edgeCases.map((edge, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {edge}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
