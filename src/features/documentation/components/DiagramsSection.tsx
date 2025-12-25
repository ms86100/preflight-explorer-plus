import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Code, Image, Copy, Check } from 'lucide-react';
import { diagramsData } from '../data/diagramsData';

// Initialize mermaid with custom config
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#fff',
    primaryBorderColor: '#4f46e5',
    lineColor: '#94a3b8',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#e2e8f0',
    background: '#ffffff',
    mainBkg: '#f8fafc',
    nodeBorder: '#cbd5e1',
    clusterBkg: '#f1f5f9',
    titleColor: '#1e293b',
    actorBorder: '#6366f1',
    actorBkg: '#f8fafc',
    actorTextColor: '#1e293b',
    actorLineColor: '#94a3b8',
    signalColor: '#1e293b',
    signalTextColor: '#1e293b',
    labelBoxBkgColor: '#f1f5f9',
    labelBoxBorderColor: '#cbd5e1',
    labelTextColor: '#1e293b',
    loopTextColor: '#1e293b',
    noteBorderColor: '#6366f1',
    noteBkgColor: '#eef2ff',
    noteTextColor: '#1e293b',
    activationBorderColor: '#6366f1',
    activationBkgColor: '#eef2ff',
    sequenceNumberColor: '#ffffff',
    sectionBkgColor: '#f1f5f9',
    altSectionBkgColor: '#ffffff',
    sectionBkgColor2: '#e2e8f0',
    taskBorderColor: '#6366f1',
    taskBkgColor: '#eef2ff',
    taskTextColor: '#1e293b',
    taskTextLightColor: '#64748b',
    taskTextOutsideColor: '#1e293b',
    gridColor: '#e2e8f0',
    doneTaskBkgColor: '#dcfce7',
    doneTaskBorderColor: '#22c55e',
    critBorderColor: '#ef4444',
    critBkgColor: '#fee2e2',
    todayLineColor: '#6366f1',
    relationColor: '#94a3b8',
    relationLabelColor: '#64748b',
  },
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
});

interface MermaidDiagramProps {
  code: string;
  id: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, code);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [code, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Rendering diagram...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-destructive/10 rounded-lg border border-destructive/20">
        <div className="text-center p-4">
          <p className="text-sm text-destructive font-medium">Failed to render diagram</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="mermaid-container bg-white rounded-lg p-4 overflow-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const DiagramsSection: React.FC = () => {
  const [activeType, setActiveType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<Record<string, 'visual' | 'code'>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const diagramTypes = [
    { id: 'all', label: 'All' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'flow', label: 'Flow' },
    { id: 'sequence', label: 'Sequence' },
    { id: 'erd', label: 'ERD' },
    { id: 'mindmap', label: 'Mind Map' },
  ];

  const filteredDiagrams = activeType === 'all' 
    ? diagramsData 
    : diagramsData.filter(d => d.type === activeType);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'architecture': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'flow': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'sequence': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'erd': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'mindmap': return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const toggleViewMode = (diagramId: string) => {
    setViewMode(prev => ({
      ...prev,
      [diagramId]: prev[diagramId] === 'code' ? 'visual' : 'code'
    }));
  };

  const copyToClipboard = async (code: string, diagramId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(diagramId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getViewMode = (diagramId: string) => viewMode[diagramId] || 'visual';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Visual Diagrams</h1>
        <p className="text-muted-foreground">
          Interactive architecture, flow, and entity relationship diagrams for the system.
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList>
          {diagramTypes.map((type) => (
            <TabsTrigger key={type.id} value={type.id}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Diagram Cards */}
      <div className="grid gap-6">
        {filteredDiagrams.map((diagram) => (
          <Card key={diagram.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{diagram.title}</CardTitle>
                  <CardDescription className="mt-1">{diagram.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(diagram.type)} variant="outline">
                    {diagram.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={getViewMode(diagram.id) === 'visual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode(prev => ({ ...prev, [diagram.id]: 'visual' }))}
                    className="gap-1.5"
                  >
                    <Image className="h-3.5 w-3.5" />
                    Visual
                  </Button>
                  <Button
                    variant={getViewMode(diagram.id) === 'code' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode(prev => ({ ...prev, [diagram.id]: 'code' }))}
                    className="gap-1.5"
                  >
                    <Code className="h-3.5 w-3.5" />
                    Code
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(diagram.mermaidCode, diagram.id)}
                  className="gap-1.5"
                >
                  {copiedId === diagram.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              {/* Diagram Content */}
              <div className="rounded-lg border overflow-hidden">
                {getViewMode(diagram.id) === 'visual' ? (
                  <ScrollArea className="h-[500px]">
                    <MermaidDiagram code={diagram.mermaidCode} id={diagram.id} />
                  </ScrollArea>
                ) : (
                  <div className="bg-muted/50">
                    <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Mermaid Code</span>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto">
                        <code className="text-muted-foreground">{diagram.mermaidCode}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Using These Diagrams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">In Documentation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Copy the Mermaid code block</li>
                <li>• Paste into GitHub README or Wiki</li>
                <li>• GitHub renders Mermaid natively</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Presentations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use Mermaid Live Editor to export as PNG/SVG</li>
                <li>• Import into slides or documents</li>
                <li>• Customize colors and styling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
