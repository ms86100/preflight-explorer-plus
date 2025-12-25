import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { diagramsData } from '../data/diagramsData';

// Note: In a real implementation, you would use a Mermaid rendering library
// For now, we'll display the code with syntax highlighting

export const DiagramsSection: React.FC = () => {
  const [activeType, setActiveType] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Visual Diagrams</h1>
        <p className="text-muted-foreground">
          Architecture, flow, and entity relationship diagrams for the system.
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
              {/* Mermaid Diagram Visualization */}
              <div className="rounded-lg bg-muted/50 border overflow-hidden">
                <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Mermaid Diagram</span>
                  <Badge variant="outline" className="text-xs">
                    Copy code to render
                  </Badge>
                </div>
                <ScrollArea className="h-[400px]">
                  <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto">
                    <code className="text-muted-foreground">{diagram.mermaidCode}</code>
                  </pre>
                </ScrollArea>
              </div>
              
              {/* Render instruction */}
              <p className="text-xs text-muted-foreground mt-3">
                To render this diagram, paste the code into{' '}
                <a 
                  href="https://mermaid.live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Mermaid Live Editor
                </a>
                {' '}or use a Mermaid-compatible markdown viewer.
              </p>
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
