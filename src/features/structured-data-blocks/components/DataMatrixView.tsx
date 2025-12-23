import { useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  ArrowLeft, Plus, Trash2, Pencil, Save, 
  Download, Upload, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { DataBlockSchema, DataRow, ColumnDefinition, ValidationError } from '../types';

interface DataMatrixViewProps {
  readonly schema: DataBlockSchema;
  readonly onBack: () => void;
}

export function DataMatrixView({ schema, onBack }: DataMatrixViewProps) {
  const [rows, setRows] = useState<DataRow[]>([
    {
      id: '1',
      values: { partId: 'P001', partName: 'Resistor 10k', quantity: 100, certified: true, status: 'Available' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user-1',
    },
    {
      id: '2',
      values: { partId: 'P002', partName: 'Capacitor 100uF', quantity: 50, certified: false, status: 'Ordered' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'user-1',
    },
  ]);

  const [editingRow, setEditingRow] = useState<DataRow | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateRow = (values: Record<string, unknown>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    schema.columns.forEach((col) => {
      const value = values[col.key];
      
      if (col.required && (value === undefined || value === null || value === '')) {
        errors.push({
          rowId: editingRow?.id || 'new',
          columnKey: col.key,
          message: `${col.label} is required`,
        });
      }

      if (col.type === 'number' && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (Number.isNaN(numValue)) {
          errors.push({
            rowId: editingRow?.id || 'new',
            columnKey: col.key,
            message: `${col.label} must be a number`,
          });
        } else {
          if (col.min !== undefined && numValue < col.min) {
            errors.push({
              rowId: editingRow?.id || 'new',
              columnKey: col.key,
              message: `${col.label} must be at least ${col.min}`,
            });
          }
          if (col.max !== undefined && numValue > col.max) {
            errors.push({
              rowId: editingRow?.id || 'new',
              columnKey: col.key,
              message: `${col.label} must be at most ${col.max}`,
            });
          }
        }
      }
    });

    return errors;
  };

  const handleOpenSheet = (row?: DataRow) => {
    if (row) {
      setEditingRow(row);
      setEditValues(row.values);
    } else {
      setEditingRow(null);
      setEditValues({});
    }
    setValidationErrors([]);
    setIsSheetOpen(true);
  };

  const handleSaveRow = () => {
    const errors = validateRow(editValues);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (editingRow) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, values: editValues, updated_at: new Date().toISOString() }
            : r
        )
      );
      toast.success('Row updated');
    } else {
      const newRow: DataRow = {
        id: Date.now().toString(),
        values: editValues,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current-user',
      };
      setRows((prev) => [...prev, newRow]);
      toast.success('Row added');
    }
    setIsSheetOpen(false);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success('Row deleted');
  };

  const getErrorForColumn = (columnKey: string): string | undefined => {
    return validationErrors.find((e) => e.columnKey === columnKey)?.message;
  };

  const renderCellValue = (column: ColumnDefinition, value: unknown): ReactNode => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-muted-foreground italic">—</span>;
    }

    switch (column.type) {
      case 'boolean':
        return value ? (
          <Badge variant="default" className="text-xs">Yes</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">No</Badge>
        );
      case 'enum':
        return <Badge variant="secondary">{String(value)}</Badge>;
      case 'date':
        return new Date(value as string).toLocaleDateString();
      default:
        return String(value);
    }
  };

  const renderInputField = (column: ColumnDefinition, value: unknown): ReactNode => {
    const error = getErrorForColumn(column.key);

    switch (column.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) =>
                setEditValues((prev) => ({ ...prev, [column.key]: checked }))
              }
            />
            <span className="text-sm">{value ? 'Yes' : 'No'}</span>
          </div>
        );
      case 'enum':
        return (
          <Select
            value={String(value || '')}
            onValueChange={(v) => setEditValues((prev) => ({ ...prev, [column.key]: v }))}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [column.key]: e.target.value }))}
            min={column.min}
            max={column.max}
            className={error ? 'border-destructive' : ''}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={String(value || '')}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [column.key]: e.target.value }))}
            className={error ? 'border-destructive' : ''}
          />
        );
      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [column.key]: e.target.value }))}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h3 className="font-medium">{schema.name}</h3>
            <p className="text-sm text-muted-foreground">{rows.length} rows</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => handleOpenSheet()}>
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {schema.columns.map((col) => (
                <TableHead key={col.key}>
                  {col.label}
                  {col.required && <span className="text-destructive ml-1">*</span>}
                </TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {schema.columns.map((col) => (
                  <TableCell key={col.key}>
                    {renderCellValue(col, row.values[col.key])}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleOpenSheet(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={schema.columns.length + 1} className="text-center py-8">
                  <p className="text-muted-foreground">No data yet</p>
                  <Button variant="link" onClick={() => handleOpenSheet()}>
                    Add your first row
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingRow ? 'Edit Row' : 'Add Row'}</SheetTitle>
            <SheetDescription>
              Fill in the values for each column
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-4">
            {validationErrors.length > 0 && (
              <Card className="border-destructive bg-destructive/10 p-3">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Please fix the following errors:</span>
                </div>
                <ul className="mt-2 text-sm text-destructive list-disc pl-6">
                  {validationErrors.map((err) => (
                    <li key={`${err.columnKey}-${err.rowId}`}>{err.message}</li>
                  ))}
                </ul>
              </Card>
            )}

            {schema.columns.map((col) => (
              <div key={col.key} className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  {col.label}
                  {col.required && <span className="text-destructive">*</span>}
                </label>
                {renderInputField(col, editValues[col.key])}
                {col.description && (
                  <p className="text-xs text-muted-foreground">{col.description}</p>
                )}
                {getErrorForColumn(col.key) && (
                  <p className="text-xs text-destructive">{getErrorForColumn(col.key)}</p>
                )}
              </div>
            ))}
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRow}>
              <Save className="h-4 w-4 mr-1" />
              {editingRow ? 'Update' : 'Add'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
