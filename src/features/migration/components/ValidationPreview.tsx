import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ValidationResult } from "../types";

interface ValidationPreviewProps {
  readonly result: ValidationResult;
  readonly fieldMappings: Readonly<Record<string, string>>;
}

export function ValidationPreview({ result, fieldMappings }: ValidationPreviewProps) {
  const mappedFields = Object.keys(fieldMappings).filter(k => fieldMappings[k]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{result.totalRows}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
          </CardContent>
        </Card>
        <Card className={result.validRows === result.totalRows ? 'border-green-500' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{result.validRows}</p>
              <p className="text-sm text-muted-foreground">Valid Records</p>
            </div>
          </CardContent>
        </Card>
        <Card className={result.errors.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{result.errors.length}</p>
              <p className="text-sm text-muted-foreground">Errors Found</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {result.isValid ? (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Validation Passed</AlertTitle>
          <AlertDescription>
            All {result.totalRows} records are valid and ready to import.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            {result.errors.length} error(s) found. Please review and fix the issues below.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Preview (First 5 Records)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  {mappedFields.map((field) => (
                    <TableHead key={field} className="min-w-[120px]">
                      {field}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.preview.map((row, rowIndex) => (
                  <TableRow key={`preview-row-${rowIndex}`}>
                    <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                    {mappedFields.map((field) => (
                      <TableCell key={field} className="max-w-[200px] truncate">
                        {String(row[field] || '-')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Errors List */}
      {result.errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {result.errors.map((error) => (
                  <div
                    key={`error-${error.row}-${error.field}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <Badge variant="outline" className="shrink-0">
                      Row {error.row}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{error.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {error.field}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {error.errorType}
                        </Badge>
                        {error.originalValue && (
                          <span className="text-xs text-muted-foreground truncate">
                            Value: "{error.originalValue}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {result.errors.length >= 100 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing first 100 errors. Fix these issues and re-validate.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
