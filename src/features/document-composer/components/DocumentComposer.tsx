import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Table, FileType, Download, Settings, 
  Plus, Eye, Trash2, CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import { ExportWizard } from './ExportWizard';
import { TemplateEditor } from './TemplateEditor';
import { ExportHistory } from './ExportHistory';
import type { ExportFormat } from '../types';

export function DocumentComposer() {
  const [activeTab, setActiveTab] = useState('export');
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);

  const handleStartExport = (format: ExportFormat) => {
    setSelectedFormat(format);
    setShowExportWizard(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Composer
          </h2>
          <p className="text-sm text-muted-foreground">
            Export work items to PDF, Excel, and Word with custom templates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="export">Quick Export</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <ExportFormatCard
              format="pdf"
              title="PDF Document"
              description="Generate formatted PDF reports with headers, sections, and watermarks"
              icon={<FileText className="h-8 w-8" />}
              onExport={() => handleStartExport('pdf')}
            />
            <ExportFormatCard
              format="xlsx"
              title="Excel Spreadsheet"
              description="Export data to Excel with multiple sheets and formulas"
              icon={<Table className="h-8 w-8" />}
              onExport={() => handleStartExport('xlsx')}
            />
            <ExportFormatCard
              format="docx"
              title="Word Document"
              description="Create editable Word documents with rich formatting"
              icon={<FileType className="h-8 w-8" />}
              onExport={() => handleStartExport('docx')}
            />
          </div>

          {showExportWizard && selectedFormat && (
            <ExportWizard 
              format={selectedFormat} 
              onClose={() => setShowExportWizard(false)} 
            />
          )}
        </TabsContent>

        <TabsContent value="templates">
          <TemplateEditor />
        </TabsContent>

        <TabsContent value="history">
          <ExportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ExportFormatCardProps {
  format: ExportFormat;
  title: string;
  description: string;
  icon: React.ReactNode;
  onExport: () => void;
}

function ExportFormatCard({ format, title, description, icon, onExport }: ExportFormatCardProps) {
  const colorMap: Record<ExportFormat, string> = {
    pdf: 'text-red-500',
    xlsx: 'text-green-500',
    docx: 'text-blue-500',
  };

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={onExport}>
      <CardHeader>
        <div className={`${colorMap[format]} mb-2`}>{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Start Export
        </Button>
      </CardContent>
    </Card>
  );
}
