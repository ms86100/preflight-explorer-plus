import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImportType } from '../types';
import { downloadTemplate } from '../services/templateService';

interface TemplateDownloadProps {
  importType: ImportType;
  variant?: 'default' | 'compact';
}

const TYPE_LABELS: Record<ImportType, string> = {
  issues: 'Issues',
  projects: 'Projects',
  users: 'Users',
};

export function TemplateDownload({ importType, variant = 'default' }: TemplateDownloadProps) {
  const handleDownload = (includeExamples: boolean, useJiraHeaders: boolean) => {
    downloadTemplate(importType, includeExamples, useJiraHeaders);
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Template
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Download Template</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownload(true, false)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            With sample data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload(false, false)}>
            <FileText className="h-4 w-4 mr-2" />
            Headers only
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Jira DC Format</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleDownload(true, true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Jira format with samples
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload(false, true)}>
            <FileText className="h-4 w-4 mr-2" />
            Jira format headers only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">{TYPE_LABELS[importType]} Template</h4>
          <p className="text-xs text-muted-foreground">Download a CSV template to get started</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload(true, false)}
          className="gap-2 justify-start"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span className="text-xs">With Examples</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload(false, false)}
          className="gap-2 justify-start"
        >
          <FileText className="h-4 w-4" />
          <span className="text-xs">Headers Only</span>
        </Button>
      </div>

      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground mb-2">Jira Data Center Compatible:</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(true, true)}
            className="gap-2 justify-start text-xs h-8"
          >
            <FileSpreadsheet className="h-3 w-3" />
            Jira + Examples
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(false, true)}
            className="gap-2 justify-start text-xs h-8"
          >
            <FileText className="h-3 w-3" />
            Jira Headers
          </Button>
        </div>
      </div>
    </div>
  );
}
