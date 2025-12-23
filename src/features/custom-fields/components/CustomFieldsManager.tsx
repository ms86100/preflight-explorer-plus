import { useState } from 'react';
import { 
  useCustomFieldDefinitions, 
  useCreateCustomFieldDefinition,
  useUpdateCustomFieldDefinition,
  useDeleteCustomFieldDefinition 
} from '../hooks/useCustomFields';
import { FieldType, FieldOption } from '../services/customFieldService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus, 
  Trash2, 
  Pencil, 
  Settings2,
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  User,
  Link2,
  AlignLeft
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { value: 'textarea', label: 'Text Area', icon: <AlignLeft className="h-4 w-4" /> },
  { value: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
  { value: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> },
  { value: 'select', label: 'Select', icon: <List className="h-4 w-4" /> },
  { value: 'multiselect', label: 'Multi-Select', icon: <List className="h-4 w-4" /> },
  { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'user', label: 'User Picker', icon: <User className="h-4 w-4" /> },
  { value: 'url', label: 'URL', icon: <Link2 className="h-4 w-4" /> },
];

interface FieldFormData {
  name: string;
  description: string;
  field_type: FieldType;
  is_required: boolean;
  options: FieldOption[];
}

export function CustomFieldsManager() {
  const { data: fields, isLoading } = useCustomFieldDefinitions();
  const createField = useCreateCustomFieldDefinition();
  const updateField = useUpdateCustomFieldDefinition();
  const deleteField = useDeleteCustomFieldDefinition();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FieldFormData>({
    name: '',
    description: '',
    field_type: 'text',
    is_required: false,
    options: [],
  });
  const [newOption, setNewOption] = useState({ value: '', label: '' });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      field_type: 'text',
      is_required: false,
      options: [],
    });
    setNewOption({ value: '', label: '' });
    setEditingFieldId(null);
  };

  const handleOpenDialog = (fieldId?: string) => {
    if (fieldId) {
      const field = fields?.find(f => f.id === fieldId);
      if (field) {
        setFormData({
          name: field.name,
          description: field.description || '',
          field_type: field.field_type,
          is_required: field.is_required,
          options: field.options || [],
        });
        setEditingFieldId(fieldId);
      }
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleAddOption = () => {
    if (newOption.value && newOption.label) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { ...newOption }],
      }));
      setNewOption({ value: '', label: '' });
    }
  };

  const handleRemoveOption = (value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((opt) => opt.value !== value),
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      field_type: formData.field_type,
      is_required: formData.is_required,
      options: formData.options.length > 0 ? formData.options : undefined,
    };

    if (editingFieldId) {
      updateField.mutate(
        { id: editingFieldId, data },
        { onSuccess: handleCloseDialog }
      );
    } else {
      createField.mutate(data, { onSuccess: handleCloseDialog });
    }
  };

  const getFieldTypeIcon = (type: FieldType) => {
    const option = FIELD_TYPE_OPTIONS.find(o => o.value === type);
    return option?.icon || <Type className="h-4 w-4" />;
  };

  const needsOptions = formData.field_type === 'select' || formData.field_type === 'multiselect';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Custom Fields
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingFieldId ? 'Edit Custom Field' : 'Create Custom Field'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Field Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Customer Priority"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this field..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-type">Field Type</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value: FieldType) => setFormData(prev => ({ ...prev, field_type: value }))}
                >
                  <SelectTrigger id="field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="required">Required Field</Label>
                <Switch
                  id="required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                />
              </div>

              {needsOptions && (
                <div className="space-y-2">
                  <Label htmlFor="field-options">Options</Label>
                  <div className="space-y-2">
                    {formData.options.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex-1 justify-between">
                          {opt.label} ({opt.value})
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-2"
                            onClick={() => handleRemoveOption(opt.value)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Value"
                      value={newOption.value}
                      onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Label"
                      value={newOption.label}
                      onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={handleAddOption}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.name.trim() || createField.isPending || updateField.isPending}
                >
                  {editingFieldId ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : fields?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No custom fields configured</p>
            <p className="text-sm">Create a custom field to extend issue data</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields?.map(field => (
                <TableRow key={field.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{field.name}</div>
                      {field.description && (
                        <div className="text-sm text-muted-foreground">{field.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFieldTypeIcon(field.field_type)}
                      <span className="capitalize">{field.field_type.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {field.is_required ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(field.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteField.mutate(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
