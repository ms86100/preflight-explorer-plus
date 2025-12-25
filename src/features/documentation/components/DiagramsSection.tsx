import React, { useState, useEffect, useId } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Code, Image, Copy, Check, AlertCircle } from 'lucide-react';
import { diagramsData } from '../data/diagramsData';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: false,
    curve: 'basis',
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
  },
});

interface MermaidDiagramProps {
  code: string;
  diagramId: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, diagramId }) => {
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
        // Clean the code - remove <br/> tags that cause issues
        const cleanedCode = code
          .replace(/<br\/>/g, '\\n')
          .replace(/<br>/g, '\\n');
        
        const id = `mermaid-${diagramId}-${uniqueId}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleanedCode);
        
        if (mounted) {
          setSvg(renderedSvg);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderDiagram, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [code, diagramId, uniqueId]);

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
      <div className="flex items-center justify-center h-[300px] bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="text-center p-6 max-w-md">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Diagram Preview Unavailable</p>
          <p className="text-xs text-muted-foreground mt-2">
            Switch to "Code" view to see the Mermaid source, or use the{' '}
            <a 
              href="https://mermaid.live" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mermaid Live Editor
            </a>
            {' '}to render this diagram.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="mermaid-container bg-white dark:bg-slate-900 rounded-lg p-4 min-h-[300px] flex items-center justify-center overflow-auto"
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
                <Badge className={getTypeColor(diagram.type)} variant="outline">
                  {diagram.type}
                </Badge>
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
                  <div className="max-h-[500px] overflow-auto">
                    <MermaidDiagram code={diagram.mermaidCode} diagramId={diagram.id} />
                  </div>
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
