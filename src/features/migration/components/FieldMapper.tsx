import { useMemo } from "react";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FIELD_DEFINITIONS, type ImportType } from "../types";

interface FieldMapperProps {
  importType: ImportType;
  sourceHeaders: string[];
  mappings: Record<string, string>;
  onMappingChange: (targetField: string, sourceColumn: string) => void;
}

export function FieldMapper({
  importType,
  sourceHeaders,
  mappings,
  onMappingChange
}: FieldMapperProps) {
  const fieldDef = FIELD_DEFINITIONS[importType];

  const autoSuggestMapping = useMemo(() => {
    const suggestions: Record<string, string> = {};
    
    for (const field of fieldDef.all as readonly string[]) {
      const label = (fieldDef.labels as Record<string, string>)[field]?.toLowerCase() || '';
      const fieldLower = field.toLowerCase().replace(/_/g, ' ');
      
      for (const header of sourceHeaders) {
        const headerLower = header.toLowerCase().replace(/[_-]/g, ' ');
        if (
          headerLower === fieldLower ||
          headerLower === label ||
          headerLower.includes(fieldLower) ||
          fieldLower.includes(headerLower)
        ) {
          suggestions[field] = header;
          break;
        }
      }
    }
    
    return suggestions;
  }, [sourceHeaders, fieldDef]);

  const mappedFields = Object.keys(mappings).filter(k => mappings[k]);
  const requiredMapped = fieldDef.required.filter(f => mappings[f]);
  const allRequiredMapped = requiredMapped.length === fieldDef.required.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Field Mapping</span>
          <div className="flex items-center gap-2">
            {allRequiredMapped ? (
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                All required fields mapped
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {fieldDef.required.length - requiredMapped.length} required fields missing
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Required Fields
            </h4>
            {fieldDef.required.map((field) => (
              <FieldMappingRow
                key={field}
                field={field}
                label={fieldDef.labels[field as keyof typeof fieldDef.labels]}
                isRequired
                sourceHeaders={sourceHeaders}
                currentMapping={mappings[field] || ''}
                suggestion={autoSuggestMapping[field]}
                onMappingChange={(value) => onMappingChange(field, value)}
              />
            ))}
          </div>

          {/* Optional Fields */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Optional Fields
            </h4>
            {fieldDef.optional.map((field) => (
              <FieldMappingRow
                key={field}
                field={field}
                label={fieldDef.labels[field as keyof typeof fieldDef.labels]}
                isRequired={false}
                sourceHeaders={sourceHeaders}
                currentMapping={mappings[field] || ''}
                suggestion={autoSuggestMapping[field]}
                onMappingChange={(value) => onMappingChange(field, value)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>{mappedFields.length}</strong> of <strong>{fieldDef.all.length}</strong> fields mapped
            {' '}({requiredMapped.length}/{fieldDef.required.length} required)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface FieldMappingRowProps {
  field: string;
  label: string;
  isRequired: boolean;
  sourceHeaders: string[];
  currentMapping: string;
  suggestion?: string;
  onMappingChange: (value: string) => void;
}

function FieldMappingRow({
  field,
  label,
  isRequired,
  sourceHeaders,
  currentMapping,
  suggestion,
  onMappingChange
}: FieldMappingRowProps) {
  const isMapped = !!currentMapping;
  const hasSuggestion = suggestion && !currentMapping;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{label}</span>
          {isRequired && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{field}</p>
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

      <div className="flex-1 min-w-0">
        <Select
          value={currentMapping || '__none__'}
          onValueChange={(value) => onMappingChange(value === '__none__' ? '' : value)}
        >
          <SelectTrigger className={isMapped ? 'border-green-500' : hasSuggestion ? 'border-yellow-500' : ''}>
            <SelectValue placeholder="Select source column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="text-muted-foreground">-- Not mapped --</span>
            </SelectItem>
            {sourceHeaders.map((header) => (
              <SelectItem key={header} value={header}>
                {header}
                {suggestion === header && (
                  <span className="ml-2 text-yellow-600 text-xs">(suggested)</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasSuggestion && (
          <button
            onClick={() => onMappingChange(suggestion)}
            className="text-xs text-yellow-600 hover:underline mt-1"
          >
            Use suggested: {suggestion}
          </button>
        )}
      </div>

      <div className="w-6 shrink-0">
        {isMapped && <Check className="h-5 w-5 text-green-500" />}
      </div>
    </div>
  );
}
