import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomFieldDefinition, CustomFieldValue } from '../services/customFieldService';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CustomFieldInputProps {
  readonly field: CustomFieldDefinition;
  readonly value?: CustomFieldValue;
  readonly onChange: (value: {
    value_text?: string | null;
    value_number?: number | null;
    value_date?: string | null;
    value_json?: unknown | null;
  }) => void;
  readonly disabled?: boolean;
}

export function CustomFieldInput({ field, value, onChange, disabled }: CustomFieldInputProps) {
  const getValue = () => {
    if (!value) return field.default_value || '';
    switch (field.field_type) {
      case 'number':
        return value.value_number?.toString() || '';
      case 'date':
      case 'datetime':
        return value.value_date || '';
      case 'multiselect':
      case 'checkbox':
        return value.value_json;
      default:
        return value.value_text || '';
    }
  };

  const currentValue = getValue();

  switch (field.field_type) {
    case 'text':
    case 'url':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>{field.name}</Label>
          <Input
            id={field.id}
            type={field.field_type === 'url' ? 'url' : 'text'}
            value={currentValue as string}
            onChange={(e) => onChange({ value_text: e.target.value || null })}
            placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>{field.name}</Label>
          <Textarea
            id={field.id}
            value={currentValue as string}
            onChange={(e) => onChange({ value_text: e.target.value || null })}
            placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
            rows={3}
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>{field.name}</Label>
          <Input
            id={field.id}
            type="number"
            value={currentValue as string}
            onChange={(e) => onChange({ 
              value_number: e.target.value ? parseFloat(e.target.value) : null 
            })}
            placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
            disabled={disabled}
          />
        </div>
      );

    case 'date':
    case 'datetime':
      const dateValue = currentValue ? new Date(currentValue as string) : undefined;
      return (
        <div className="space-y-2">
          <Label>{field.name}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => onChange({ 
                  value_date: date ? date.toISOString() : null 
                })}
              />
            </PopoverContent>
          </Popover>
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label>{field.name}</Label>
          <Select
            value={currentValue as string}
            onValueChange={(val) => onChange({ value_text: val || null })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'checkbox':
      const isChecked = currentValue === true || currentValue === 'true';
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.id}
            checked={isChecked}
            onCheckedChange={(checked) => onChange({ value_json: checked })}
            disabled={disabled}
          />
          <Label htmlFor={field.id}>{field.name}</Label>
        </div>
      );

    case 'multiselect':
      const selectedValues = (currentValue as string[]) || [];
      return (
        <div className="space-y-2">
          <Label>{field.name}</Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
            {field.options?.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter(v => v !== opt.value)
                      : [...selectedValues, opt.value];
                    onChange({ value_json: newValues });
                  }}
                  disabled={disabled}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={field.id}>{field.name}</Label>
          <Input
            id={field.id}
            value={currentValue as string}
            onChange={(e) => onChange({ value_text: e.target.value || null })}
            disabled={disabled}
          />
        </div>
      );
  }
}
