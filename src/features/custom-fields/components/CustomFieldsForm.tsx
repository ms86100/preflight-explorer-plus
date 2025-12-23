import { useState, useEffect, useRef } from 'react';
import { useCustomFieldDefinitions, useIssueCustomFieldValues, useSetCustomFieldValue } from '../hooks/useCustomFields';
import { CustomFieldInput } from './CustomFieldInput';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';

interface CustomFieldsFormProps {
  readonly issueId: string;
  readonly projectId?: string;
  readonly issueTypeId?: string;
  readonly disabled?: boolean;
}

export function CustomFieldsForm({ issueId, disabled }: CustomFieldsFormProps) {
  const { data: fields, isLoading: fieldsLoading } = useCustomFieldDefinitions();
  const { data: values, isLoading: valuesLoading } = useIssueCustomFieldValues(issueId);
  const setFieldValue = useSetCustomFieldValue();
  
  // Local state for field values to enable smooth typing
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const isLoading = fieldsLoading || valuesLoading;

  // Sync local state when server values change
  useEffect(() => {
    if (values) {
      const valuesMap: Record<string, any> = {};
      values.forEach(v => {
        valuesMap[v.field_id] = v;
      });
      setLocalValues(valuesMap);
    }
  }, [values]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!fields?.length) {
    return null;
  }

  const getValueForField = (fieldId: string) => {
    return localValues[fieldId];
  };

  const handleFieldChange = (fieldId: string, newValue: {
    value_text?: string | null;
    value_number?: number | null;
    value_date?: string | null;
    value_json?: unknown | null;
  }) => {
    // Update local state immediately for smooth typing
    setLocalValues(prev => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], ...newValue, field_id: fieldId }
    }));

    // Clear existing debounce timer
    if (debounceTimers.current[fieldId]) {
      clearTimeout(debounceTimers.current[fieldId]);
    }

    // Debounce the actual save
    debounceTimers.current[fieldId] = setTimeout(() => {
      setFieldValue.mutate({
        issue_id: issueId,
        field_id: fieldId,
        ...newValue,
      });
    }, 500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Custom Fields
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(field => (
          <CustomFieldInput
            key={field.id}
            field={field}
            value={getValueForField(field.id)}
            onChange={(newValue) => handleFieldChange(field.id, newValue)}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
}
