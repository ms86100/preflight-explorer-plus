import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportType, ENHANCED_FIELD_DEFINITIONS } from '../types';

interface FormatGuideModalProps {
  importType?: ImportType;
  trigger?: React.ReactNode;
}

interface FieldMeta {
  label: string;
  jiraHeader: string;
  type: string;
  required: boolean;
  maxLength?: number;
  example: string;
  description: string;
  validValues?: readonly string[];
}

function FieldCard({ fieldKey, metadata, required }: { 
  fieldKey: string; 
  metadata: FieldMeta;
  required: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{metadata.label}</h4>
            {required ? (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{metadata.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Field Name:</span>
          <code className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs">{fieldKey}</code>
        </div>
        <div>
          <span className="text-muted-foreground">Jira Header:</span>
          <code className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs">{metadata.jiraHeader}</code>
        </div>
        <div>
          <span className="text-muted-foreground">Type:</span>
          <Badge variant="outline" className="ml-2 text-xs">{metadata.type}</Badge>
        </div>
        {metadata.maxLength && (
          <div>
            <span className="text-muted-foreground">Max Length:</span>
            <span className="ml-2">{metadata.maxLength} chars</span>
          </div>
        )}
      </div>
      
      <div className="bg-muted/50 rounded-md p-3">
        <p className="text-xs text-muted-foreground mb-1">Example:</p>
        <code className="text-sm">{metadata.example}</code>
      </div>
      
      {metadata.validValues && metadata.validValues.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Valid Values:</p>
          <div className="flex flex-wrap gap-1">
            {metadata.validValues.map(value => (
              <Badge key={value} variant="outline" className="text-xs">{value}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ImportTypeGuide({ importType }: { importType: ImportType }) {
  const fieldDefs = ENHANCED_FIELD_DEFINITIONS[importType];
  
  return (
    <div className="space-y-6">
      {/* Required Fields */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-destructive" />
          Required Fields
        </h3>
        <div className="space-y-3">
          {fieldDefs.required.map(fieldKey => {
            const meta = fieldDefs.metadata[fieldKey as keyof typeof fieldDefs.metadata] as FieldMeta;
            return (
              <FieldCard 
                key={fieldKey}
                fieldKey={fieldKey}
                metadata={meta}
                required={true}
              />
            );
          })}
        </div>
      </div>
      
      {/* Optional Fields */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          Optional Fields
        </h3>
        <div className="space-y-3">
          {fieldDefs.optional.map(fieldKey => {
            const meta = fieldDefs.metadata[fieldKey as keyof typeof fieldDefs.metadata] as FieldMeta;
            return (
              <FieldCard 
                key={fieldKey}
                fieldKey={fieldKey}
                metadata={meta}
                required={false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FormatGuideModal({ importType, trigger }: FormatGuideModalProps) {
  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <Info className="h-4 w-4" />
      Format Guide
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>CSV Import Format Guide</DialogTitle>
          <DialogDescription>
            Learn about the required and optional fields for each import type
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={importType || 'issues'} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[60vh] mt-4 pr-4">
            <TabsContent value="issues" className="mt-0">
              <ImportTypeGuide importType="issues" />
            </TabsContent>
            <TabsContent value="projects" className="mt-0">
              <ImportTypeGuide importType="projects" />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <ImportTypeGuide importType="users" />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        {/* Common Tips */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Important Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use UTF-8 encoding for special characters</li>
            <li>• Wrap fields containing commas in double quotes</li>
            <li>• Use ISO date format (YYYY-MM-DD) or Jira format (DD/MMM/YY)</li>
            <li>• For Jira exports, assignee/reporter fields accept usernames - they'll be matched to emails</li>
            <li>• Labels should be comma-separated within the cell</li>
            <li>• Empty optional fields can be left blank</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
