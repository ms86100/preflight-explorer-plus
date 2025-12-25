import React, { useState, useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Folder, Code, Settings, Users, GitBranch, Image, AlertCircle, Printer } from 'lucide-react';
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
      className="bg-white dark:bg-slate-900 rounded-lg p-3 overflow-visible print:overflow-visible"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const ModulesSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const moduleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const filteredModules = moduleDocumentation.filter(
    module =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModuleDiagrams = (diagramIds: string[] = []) => {
    return diagramsData.filter(d => diagramIds.includes(d.id));
  };

  const handlePrintModule = (moduleId: string) => {
    // Temporarily expand this module if not already
    const wasExpanded = expandedModules.includes(moduleId);
    if (!wasExpanded) {
      setExpandedModules([moduleId]);
    }
    
    // Wait for render then print
    setTimeout(() => {
      const moduleEl = moduleRefs.current[moduleId];
      if (moduleEl) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const module = moduleDocumentation.find(m => m.id === moduleId);
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>${module?.name || 'Module'} Documentation</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 20px;
                  line-height: 1.6;
                  color: #1a1a1a;
                }
                h1 { font-size: 24px; margin-bottom: 8px; }
                h2 { font-size: 18px; margin: 16px 0 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
                h3 { font-size: 16px; margin: 12px 0 6px; }
                h4 { font-size: 14px; margin: 8px 0 4px; font-weight: 600; }
                p { margin: 4px 0; font-size: 14px; color: #666; }
                .section { margin: 16px 0; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
                .diagram-container { 
                  background: #f9fafb; 
                  padding: 16px; 
                  border-radius: 8px; 
                  margin: 8px 0;
                  page-break-inside: avoid;
                }
                .diagram-container svg { max-width: 100%; height: auto; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
                th, td { border: 1px solid #e5e5e5; padding: 8px; text-align: left; }
                th { background: #f5f5f5; font-weight: 600; }
                ul, ol { padding-left: 20px; font-size: 14px; }
                li { margin: 4px 0; }
                .badge { 
                  display: inline-block; 
                  padding: 2px 8px; 
                  border-radius: 4px; 
                  font-size: 11px;
                  background: #f0f0f0;
                  margin: 2px;
                }
                .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .mono { font-family: monospace; font-size: 12px; }
                @media print {
                  body { padding: 0; }
                  .section { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              <h1>${module?.name}</h1>
              <p>${module?.description}</p>
              ${moduleEl.innerHTML}
            </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        }
      }
      
      // Restore previous state
      if (!wasExpanded) {
        setExpandedModules([]);
      }
    }, 100);
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
      <Accordion 
        type="multiple" 
        value={expandedModules}
        onValueChange={setExpandedModules}
        className="space-y-4"
      >
        {filteredModules.map((module) => {
          const moduleDiagrams = getModuleDiagrams(module.associatedDiagrams);
          
          return (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Folder className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{module.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{module.description}</p>
                  </div>
                  {moduleDiagrams.length > 0 && (
                    <Badge variant="outline" className="ml-auto mr-2 gap-1 flex-shrink-0">
                      <GitBranch className="h-3 w-3" />
                      {moduleDiagrams.length} diagram{moduleDiagrams.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 flex-shrink-0 print:hidden"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintModule(module.id);
                    }}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-6">
                <div ref={(el) => { moduleRefs.current[module.id] = el; }} className="space-y-6">
                
                {/* 1. Purpose & Business Intent - FIRST */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Folder className="w-4 h-4 text-primary" />
                      </div>
                      Purpose & Business Intent
                    </CardTitle>
                    <CardDescription>
                      Why this module exists and the business value it provides
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-background rounded-lg p-4 border">
                      <h4 className="font-semibold text-sm mb-2 text-foreground">Overview</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{module.purpose}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-background rounded-lg p-4 border">
                        <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                          <span className="text-yellow-500">⚡</span> Preconditions
                        </h4>
                        <ul className="space-y-1.5">
                          {module.preconditions.map((pre, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">•</span>
                              <span>{pre}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-background rounded-lg p-4 border">
                        <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                          <span className="text-green-500">✓</span> Postconditions
                        </h4>
                        <ul className="space-y-1.5">
                          {module.postconditions.map((post, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{post}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. User Flow - SECOND */}
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-blue-600" />
                      </div>
                      User Flow & Journey
                    </CardTitle>
                    <CardDescription>
                      Step-by-step walkthrough of how users interact with this module
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Connection line */}
                      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-blue-200 dark:bg-blue-800" />
                      
                      <ol className="space-y-4">
                        {module.userFlow.map((step, i) => (
                          <li key={i} className="flex items-start gap-4 relative">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-semibold z-10 shadow-md">
                              {i + 1}
                            </div>
                            <div className="flex-1 bg-background rounded-lg p-3 border shadow-sm mt-0.5">
                              <p className="text-sm text-foreground">{step}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Role-Based Behavior - THIRD */}
                <Card className="border-purple-500/30 bg-purple-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      Role-Based Behavior
                    </CardTitle>
                    <CardDescription>
                      What different user roles can do within this module
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-background rounded-lg p-4 border">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="default" className="bg-purple-600">Admin</Badge>
                          <span className="text-xs text-muted-foreground">Full access</span>
                        </div>
                        <ul className="space-y-2">
                          {module.roles.admin.map((cap, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5">▸</span>
                              <span>{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-background rounded-lg p-4 border">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary">User</Badge>
                          <span className="text-xs text-muted-foreground">Standard access</span>
                        </div>
                        <ul className="space-y-2">
                          {module.roles.user.map((cap, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground mt-0.5">▸</span>
                              <span>{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Visual Diagrams */}
                {moduleDiagrams.length > 0 && (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Image className="w-4 h-4 text-primary" />
                        </div>
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

                {/* 5. API Documentation */}
                {module.apiDocumentation && module.apiDocumentation.length > 0 && (
                  <Card className="border-blue-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Code className="w-4 h-4 text-blue-600" />
                        </div>
                        API Documentation
                      </CardTitle>
                      <CardDescription>
                        REST API endpoints for this module
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Method</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="w-20">Auth</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {module.apiDocumentation.map((api, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    api.method === 'GET' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
                                    api.method === 'POST' ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' :
                                    api.method === 'PUT' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30' :
                                    api.method === 'PATCH' ? 'bg-orange-500/10 text-orange-700 border-orange-500/30' :
                                    'bg-red-500/10 text-red-700 border-red-500/30'
                                  }
                                >
                                  {api.method}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{api.path}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{api.description}</TableCell>
                              <TableCell>
                                <Badge variant={api.authentication === 'required' ? 'default' : 'secondary'} className="text-xs">
                                  {api.authentication === 'required' ? '🔐' : '🔓'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* 6. Implementation Details */}
                {module.implementationDetails && module.implementationDetails.length > 0 && (
                  <Card className="border-green-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-green-600" />
                        </div>
                        Implementation Details
                      </CardTitle>
                      <CardDescription>
                        Technical implementation status and details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Area</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {module.implementationDetails.map((detail, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{detail.area}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{detail.description}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={
                                    detail.status === 'implemented' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
                                    detail.status === 'partial' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30' :
                                    'bg-slate-500/10 text-slate-600 border-slate-500/30'
                                  }
                                >
                                  {detail.status === 'implemented' ? '✓ Implemented' : 
                                   detail.status === 'partial' ? '◐ Partial' : '○ Planned'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* 7. File Structure */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Code className="w-4 h-4" />
                      </div>
                      File Structure
                    </CardTitle>
                    <CardDescription>
                      Source code organization for this module
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Components
                        </h4>
                        {module.components.length > 0 ? (
                          <ul className="space-y-1.5 text-muted-foreground">
                            {module.components.map((comp, i) => (
                              <li key={i} className="font-mono text-xs bg-background rounded px-2 py-1">{comp}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic text-xs">No components</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          Hooks
                        </h4>
                        {module.hooks.length > 0 ? (
                          <ul className="space-y-1.5 text-muted-foreground">
                            {module.hooks.map((hook, i) => (
                              <li key={i} className="font-mono text-xs bg-background rounded px-2 py-1">{hook}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic text-xs">No hooks</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Services
                        </h4>
                        {module.services.length > 0 ? (
                          <ul className="space-y-1.5 text-muted-foreground">
                            {module.services.map((svc, i) => (
                              <li key={i} className="font-mono text-xs bg-background rounded px-2 py-1">{svc}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground italic text-xs">No services</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 8. Edge Cases */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      Edge Cases & Error Handling
                    </CardTitle>
                    <CardDescription>
                      Known edge cases and how they are handled
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {module.edgeCases.map((edge, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-1.5 px-3 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                          {edge}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
