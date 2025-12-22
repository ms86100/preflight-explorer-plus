import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Table, FileType, X, ChevronRight, ChevronLeft,
  CheckCircle, Loader2, Download, Search
} from 'lucide-react';
import { toast } from 'sonner';
import type { ExportFormat } from '../types';

interface ExportWizardProps {
  format: ExportFormat;
  onClose: () => void;
  preselectedIssues?: string[];
}

type WizardStep = 'select-issues' | 'configure' | 'preview' | 'exporting' | 'complete';

export function ExportWizard({ format, onClose, preselectedIssues = [] }: ExportWizardProps) {
  const [step, setStep] = useState<WizardStep>('select-issues');
  const [selectedIssues, setSelectedIssues] = useState<string[]>(preselectedIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [config, setConfig] = useState({
    includeAttachments: false,
    includeComments: true,
    includeHistory: false,
    addWatermark: true,
    useClassificationWatermark: true,
  });
  const [progress, setProgress] = useState(0);

  // Mock issues for demo
  const mockIssues = [
    { id: '1', key: 'PROJ-101', summary: 'Implement user authentication', status: 'In Progress', type: 'Story' },
    { id: '2', key: 'PROJ-102', summary: 'Fix login page styling', status: 'Done', type: 'Bug' },
    { id: '3', key: 'PROJ-103', summary: 'Add export functionality', status: 'To Do', type: 'Task' },
    { id: '4', key: 'PROJ-104', summary: 'Database migration script', status: 'In Progress', type: 'Task' },
    { id: '5', key: 'PROJ-105', summary: 'API rate limiting', status: 'Done', type: 'Story' },
  ];

  const filteredIssues = mockIssues.filter(
    (issue) =>
      issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleIssue = (issueId: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIssues.length === filteredIssues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(filteredIssues.map((i) => i.id));
    }
  };

  const handleExport = async () => {
    setStep('exporting');
    
    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(i);
    }
    
    setStep('complete');
    toast.success(`Export completed! ${selectedIssues.length} items exported to ${format.toUpperCase()}`);
  };

  const formatIcon = {
    pdf: <FileText className="h-5 w-5 text-red-500" />,
    xlsx: <Table className="h-5 w-5 text-green-500" />,
    docx: <FileType className="h-5 w-5 text-blue-500" />,
  };

  const renderStep = () => {
    switch (step) {
      case 'select-issues':
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {formatIcon[format]}
                Select Items to Export
              </CardTitle>
              <CardDescription>
                Choose the work items you want to include in the export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedIssues.length === filteredIssues.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-2">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        selectedIssues.includes(issue.id)
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleToggleIssue(issue.id)}
                    >
                      <Checkbox checked={selectedIssues.includes(issue.id)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {issue.key}
                          </Badge>
                          <span className="font-medium text-sm">{issue.summary}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {issue.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {issue.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="text-sm text-muted-foreground">
                {selectedIssues.length} items selected
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('configure')} disabled={selectedIssues.length === 0}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        );

      case 'configure':
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {formatIcon[format]}
                Configure Export
              </CardTitle>
              <CardDescription>
                Customize what to include in your export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Content Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="comments" className="cursor-pointer">Include Comments</Label>
                    <Checkbox
                      id="comments"
                      checked={config.includeComments}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, includeComments: !!checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="attachments" className="cursor-pointer">Include Attachments</Label>
                    <Checkbox
                      id="attachments"
                      checked={config.includeAttachments}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, includeAttachments: !!checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="history" className="cursor-pointer">Include Change History</Label>
                    <Checkbox
                      id="history"
                      checked={config.includeHistory}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, includeHistory: !!checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Security Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="watermark" className="cursor-pointer">Add Watermark</Label>
                    <Checkbox
                      id="watermark"
                      checked={config.addWatermark}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, addWatermark: !!checked }))
                      }
                    />
                  </div>
                  {config.addWatermark && (
                    <div className="flex items-center justify-between pl-4">
                      <Label htmlFor="classWatermark" className="cursor-pointer text-sm text-muted-foreground">
                        Use Classification Level
                      </Label>
                      <Checkbox
                        id="classWatermark"
                        checked={config.useClassificationWatermark}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({ ...prev, useClassificationWatermark: !!checked }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-issues')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep('preview')}>
                Preview <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        );

      case 'preview':
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {formatIcon[format]}
                Preview Export
              </CardTitle>
              <CardDescription>
                Review your export settings before generating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{format.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{selectedIssues.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-medium">{config.includeComments ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attachments</span>
                  <span className="font-medium">{config.includeAttachments ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">History</span>
                  <span className="font-medium">{config.includeHistory ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Watermark</span>
                  <span className="font-medium">
                    {config.addWatermark
                      ? config.useClassificationWatermark
                        ? 'Classification Level'
                        : 'Custom'
                      : 'None'}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('configure')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleExport}>
                Generate Export <Download className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        );

      case 'exporting':
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Export
              </CardTitle>
              <CardDescription>
                Please wait while we generate your document...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Processing {selectedIssues.length} items... {progress}%
              </p>
            </CardContent>
          </>
        );

      case 'complete':
        return (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Export Complete
              </CardTitle>
              <CardDescription>
                Your document has been generated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                <div className="mb-4">{formatIcon[format]}</div>
                <p className="font-medium">export_{new Date().toISOString().split('T')[0]}.{format}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIssues.length} items exported
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </CardFooter>
          </>
        );
    }
  };

  return (
    <Card className="mt-4">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {renderStep()}
    </Card>
  );
}
