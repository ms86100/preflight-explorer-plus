import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, Trash2, Pencil, GripVertical, 
  Type, Hash, ToggleLeft, List, Link2, Calendar
} from 'lucide-react';
import type { DataBlockSchema, ColumnDefinition, ColumnType } from '../types';
import { COLUMN_TYPE_LABELS } from '../types';

interface SchemaEditorProps {
  schemas: DataBlockSchema[];
  onSchemaCreated: (schema: DataBlockSchema) => void;
  onSchemaUpdated: (schema: DataBlockSchema) => void;
  onSchemaDeleted: (id: string) => void;
}

const COLUMN_TYPE_ICONS: Record<ColumnType, React.ReactNode> = {
  string: <Type className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
  enum: <List className="h-4 w-4" />,
  reference: <Link2 className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
};

export function SchemaEditor({ schemas, onSchemaCreated, onSchemaUpdated, onSchemaDeleted }: SchemaEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<DataBlockSchema | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    columns: [] as ColumnDefinition[],
  });
  const [newColumn, setNewColumn] = useState<Partial<ColumnDefinition>>({
    key: '',
    label: '',
    type: 'string',
    required: false,
  });
  const [enumOptions, setEnumOptions] = useState('');

  const handleOpenDialog = (schema?: DataBlockSchema) => {
    if (schema) {
      setEditingSchema(schema);
      setFormData({
        name: schema.name,
        description: schema.description || '',
        columns: schema.columns,
      });
    } else {
      setEditingSchema(null);
      setFormData({
        name: '',
        description: '',
        columns: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleAddColumn = () => {
    if (!newColumn.key || !newColumn.label) return;

    const column: ColumnDefinition = {
      key: newColumn.key,
      label: newColumn.label,
      type: newColumn.type || 'string',
      required: newColumn.required,
      min: newColumn.min,
      max: newColumn.max,
      options: newColumn.type === 'enum' ? enumOptions.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
    };

    setFormData((prev) => ({
      ...prev,
      columns: [...prev.columns, column],
    }));
    setNewColumn({ key: '', label: '', type: 'string', required: false });
    setEnumOptions('');
  };

  const handleRemoveColumn = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.key !== key),
    }));
  };

  const handleSaveSchema = () => {
    if (!formData.name.trim() || formData.columns.length === 0) return;

    const schema: DataBlockSchema = {
      id: editingSchema?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      version: editingSchema ? incrementVersion(editingSchema.version) : '1.0',
      columns: formData.columns,
      created_at: editingSchema?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: editingSchema?.created_by || 'current-user',
    };

    if (editingSchema) {
      onSchemaUpdated(schema);
    } else {
      onSchemaCreated(schema);
    }
    setIsDialogOpen(false);
  };

  const incrementVersion = (version: string): string => {
    const parts = version.split('.');
    const minor = parseInt(parts[1] || '0', 10) + 1;
    return `${parts[0]}.${minor}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Schema Definitions</h3>
          <p className="text-sm text-muted-foreground">
            Define the structure of your data blocks
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Schema
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Columns</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemas.map((schema) => (
              <TableRow key={schema.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{schema.name}</div>
                    <div className="text-sm text-muted-foreground">{schema.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {schema.columns.map((col) => (
                      <Badge key={col.key} variant="outline" className="text-xs gap-1">
                        {COLUMN_TYPE_ICONS[col.type]}
                        {col.label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">v{schema.version}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(schema.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(schema)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onSchemaDeleted(schema.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchema ? 'Edit Schema' : 'Create Schema'}
            </DialogTitle>
            <DialogDescription>
              Define the columns and validation rules for your data block
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schemaName">Schema Name</Label>
                <Input
                  id="schemaName"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Parts List"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schemaDesc">Description</Label>
                <Input
                  id="schemaDesc"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this schema..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Columns</Label>
              
              {formData.columns.length > 0 && (
                <div className="space-y-2">
                  {formData.columns.map((col, index) => (
                    <div
                      key={col.key}
                      className="flex items-center gap-2 p-3 border rounded-md bg-muted/30"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="gap-1">
                        {COLUMN_TYPE_ICONS[col.type]}
                        {COLUMN_TYPE_LABELS[col.type]}
                      </Badge>
                      <span className="font-medium">{col.label}</span>
                      <span className="text-muted-foreground text-sm">({col.key})</span>
                      {col.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveColumn(col.key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Card className="p-4 border-dashed">
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Key</Label>
                      <Input
                        value={newColumn.key || ''}
                        onChange={(e) => setNewColumn((prev) => ({ ...prev, key: e.target.value.replace(/\s/g, '') }))}
                        placeholder="columnKey"
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={newColumn.label || ''}
                        onChange={(e) => setNewColumn((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="Column Label"
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={newColumn.type}
                        onValueChange={(value: ColumnType) => setNewColumn((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COLUMN_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                {COLUMN_TYPE_ICONS[value as ColumnType]}
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newColumn.type === 'enum' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Options (comma-separated)</Label>
                      <Input
                        value={enumOptions}
                        onChange={(e) => setEnumOptions(e.target.value)}
                        placeholder="Option 1, Option 2, Option 3"
                        className="h-8"
                      />
                    </div>
                  )}

                  {newColumn.type === 'number' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Min Value</Label>
                        <Input
                          type="number"
                          value={newColumn.min || ''}
                          onChange={(e) => setNewColumn((prev) => ({ ...prev, min: Number(e.target.value) }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Value</Label>
                        <Input
                          type="number"
                          value={newColumn.max || ''}
                          onChange={(e) => setNewColumn((prev) => ({ ...prev, max: Number(e.target.value) }))}
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newColumn.required}
                        onCheckedChange={(checked) => setNewColumn((prev) => ({ ...prev, required: checked }))}
                      />
                      <Label className="text-sm">Required</Label>
                    </div>
                    <Button size="sm" onClick={handleAddColumn} disabled={!newColumn.key || !newColumn.label}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Column
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchema} disabled={!formData.name.trim() || formData.columns.length === 0}>
              {editingSchema ? 'Update Schema' : 'Create Schema'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
