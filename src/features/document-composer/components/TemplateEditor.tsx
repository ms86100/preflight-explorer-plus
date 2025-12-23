import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, FileText, Table, FileType, Pencil, Trash2, Copy, 
  GripVertical, ChevronDown, ChevronUp
} from 'lucide-react';
import type { DocumentTemplate, ExportFormat, TemplateSection } from '../types';

export function TemplateEditor() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([
    {
      id: '1',
      name: 'Standard Issue Report',
      description: 'Default template with all standard fields',
      format: 'pdf',
      schema: {
        header: { title: '{{item.key}} – {{item.summary}}', classification: true },
        sections: [
          { name: 'Overview', type: 'fields', fields: ['summary', 'status', 'priority', 'assignee'] },
          { name: 'Description', type: 'fields', fields: ['description'] },
          { name: 'Comments', type: 'comments' },
        ],
        footer: { showDate: true, showPageNumbers: true },
        watermark: { enabled: true, useClassification: true },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
      is_default: true,
    },
    {
      id: '2',
      name: 'Excel Data Export',
      description: 'Spreadsheet format for data analysis',
      format: 'xlsx',
      schema: {
        sections: [
          { name: 'All Fields', type: 'fields', fields: ['key', 'summary', 'status', 'priority', 'assignee', 'created', 'updated'] },
        ],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'pdf' as ExportFormat,
    includeHeader: true,
    headerTitle: '{{item.key}} – {{item.summary}}',
    showClassification: true,
    sections: [] as TemplateSection[],
    showWatermark: true,
    showFooterDate: true,
    showPageNumbers: true,
  });

  const formatIcons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-4 w-4 text-red-500" />,
    xlsx: <Table className="h-4 w-4 text-green-500" />,
    docx: <FileType className="h-4 w-4 text-blue-500" />,
    html: <FileText className="h-4 w-4 text-orange-500" />,
  };

  const handleOpenDialog = (template?: DocumentTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        format: template.format,
        includeHeader: !!template.schema.header,
        headerTitle: template.schema.header?.title || '',
        showClassification: template.schema.header?.classification || false,
        sections: template.schema.sections,
        showWatermark: template.schema.watermark?.enabled || false,
        showFooterDate: template.schema.footer?.showDate || false,
        showPageNumbers: template.schema.footer?.showPageNumbers || false,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        format: 'pdf',
        includeHeader: true,
        headerTitle: '{{item.key}} – {{item.summary}}',
        showClassification: true,
        sections: [{ name: 'Overview', type: 'fields', fields: ['summary', 'status', 'priority'] }],
        showWatermark: true,
        showFooterDate: true,
        showPageNumbers: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    const newTemplate: DocumentTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      format: formData.format,
      schema: {
        header: formData.includeHeader ? {
          title: formData.headerTitle,
          classification: formData.showClassification,
        } : undefined,
        sections: formData.sections,
        footer: {
          showDate: formData.showFooterDate,
          showPageNumbers: formData.showPageNumbers,
        },
        watermark: {
          enabled: formData.showWatermark,
          useClassification: true,
        },
      },
      created_at: editingTemplate?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: editingTemplate?.created_by || 'current-user',
    };

    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? newTemplate : t)));
    } else {
      setTemplates((prev) => [...prev, newTemplate]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, { name: 'New Section', type: 'fields', fields: [] }],
    }));
  };

  const handleRemoveSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateSection = (index: number, updates: Partial<TemplateSection>) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Document Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage reusable export templates
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {formatIcons[template.format]}
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.format.toUpperCase()} • {template.schema.sections.length} sections
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {template.description || 'No description'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                {!template.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Configure your document export template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sprint Report Template"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Output Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value: ExportFormat) =>
                    setFormData((prev) => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                    <SelectItem value="docx">Word Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this template..."
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Header Section</Label>
                <Switch
                  checked={formData.includeHeader}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, includeHeader: checked }))
                  }
                />
              </div>
              {formData.includeHeader && (
                <div className="pl-4 space-y-3 border-l-2">
                  <div className="space-y-2">
                    <Label htmlFor="headerTitle" className="text-sm">Title Template</Label>
                    <Input
                      id="headerTitle"
                      value={formData.headerTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, headerTitle: e.target.value }))
                      }
                      placeholder="{{item.key}} – {{item.summary}}"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{{item.field}}'} for dynamic values
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Classification</Label>
                    <Switch
                      checked={formData.showClassification}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, showClassification: checked }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sections</Label>
                <Button variant="outline" size="sm" onClick={handleAddSection}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Section
                </Button>
              </div>
              <div className="space-y-2">
                {formData.sections.map((section, index) => {
                  const sectionNameId = `section-name-${index}`;
                  return (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 border rounded-md bg-muted/30"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <Label htmlFor={sectionNameId} className="sr-only">Section name</Label>
                    <Input
                      id={sectionNameId}
                      value={section.name}
                      onChange={(e) => handleUpdateSection(index, { name: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={section.type}
                      onValueChange={(value) =>
                        handleUpdateSection(index, { type: value as TemplateSection['type'] })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fields">Fields</SelectItem>
                        <SelectItem value="comments">Comments</SelectItem>
                        <SelectItem value="attachments">Attachments</SelectItem>
                        <SelectItem value="timeline">Timeline</SelectItem>
                        <SelectItem value="linked-items">Linked Items</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveSection(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Footer & Watermark</Label>
              <div className="space-y-2 pl-4 border-l-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Watermark</Label>
                  <Switch
                    checked={formData.showWatermark}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, showWatermark: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Date</Label>
                  <Switch
                    checked={formData.showFooterDate}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, showFooterDate: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show Page Numbers</Label>
                  <Switch
                    checked={formData.showPageNumbers}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, showPageNumbers: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!formData.name.trim()}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
