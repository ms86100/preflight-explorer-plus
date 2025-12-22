import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Upload, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CSVUploader } from "./CSVUploader";
import { FieldMapper } from "./FieldMapper";
import { ValidationPreview } from "./ValidationPreview";
import { ImportProgress } from "./ImportProgress";
import { 
  validateCSV, 
  createImportJob, 
  startImport, 
  parseCSVHeaders, 
  countCSVRows 
} from "../services/importService";
import { FIELD_DEFINITIONS, type ImportType, type ValidationResult } from "../types";

type WizardStep = 'select-type' | 'upload' | 'mapping' | 'validate' | 'import' | 'complete';

interface ImportWizardProps {
  onComplete: () => void;
}

export function ImportWizard({ onComplete }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('select-type');
  const [importType, setImportType] = useState<ImportType>('issues');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleTypeSelect = (type: ImportType) => {
    setImportType(type);
    setStep('upload');
  };

  const handleFileLoad = useCallback((content: string, name: string) => {
    setCsvContent(content);
    setFileName(name);
    const parsedHeaders = parseCSVHeaders(content);
    setHeaders(parsedHeaders);
    
    // Auto-suggest mappings
    const fieldDef = FIELD_DEFINITIONS[importType];
    const autoMappings: Record<string, string> = {};
    
    for (const field of fieldDef.all as readonly string[]) {
      const label = (fieldDef.labels as Record<string, string>)[field]?.toLowerCase() || '';
      const fieldLower = field.toLowerCase().replace(/_/g, ' ');
      
      for (const header of parsedHeaders) {
        const headerLower = header.toLowerCase().replace(/[_-]/g, ' ');
        if (
          headerLower === fieldLower ||
          headerLower === label ||
          headerLower.includes(fieldLower) ||
          fieldLower.includes(headerLower)
        ) {
          autoMappings[field] = header;
          break;
        }
      }
    }
    
    setMappings(autoMappings);
    setStep('mapping');
  }, [importType]);

  const handleMappingChange = useCallback((targetField: string, sourceColumn: string) => {
    setMappings(prev => ({
      ...prev,
      [targetField]: sourceColumn
    }));
  }, []);

  const handleValidate = async () => {
    const fieldDef = FIELD_DEFINITIONS[importType];
    const missingRequired = fieldDef.required.filter(f => !mappings[f]);
    
    if (missingRequired.length > 0) {
      toast.error(`Missing required fields: ${missingRequired.join(', ')}`);
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateCSV(csvContent, mappings, importType);
      setValidationResult(result);
      setStep('validate');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartImport = async () => {
    if (!validationResult) return;

    setIsImporting(true);
    try {
      const job = await createImportJob(
        importType,
        fileName,
        countCSVRows(csvContent),
        mappings
      );
      
      await startImport(job.id, csvContent);
      setJobId(job.id);
      setStep('import');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportComplete = () => {
    setStep('complete');
  };

  const handleBack = () => {
    switch (step) {
      case 'upload':
        setStep('select-type');
        break;
      case 'mapping':
        setStep('upload');
        setCsvContent('');
        setFileName('');
        setHeaders([]);
        setMappings({});
        break;
      case 'validate':
        setStep('mapping');
        setValidationResult(null);
        break;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'mapping':
        const fieldDef = FIELD_DEFINITIONS[importType];
        return fieldDef.required.every(f => mappings[f]);
      case 'validate':
        return validationResult?.isValid || (validationResult && validationResult.validRows > 0);
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {['select-type', 'upload', 'mapping', 'validate', 'import'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s ? 'bg-primary text-primary-foreground' : 
                  ['complete'].includes(step) || 
                  ['select-type', 'upload', 'mapping', 'validate', 'import'].indexOf(step) > i
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground'}
              `}>
                {['complete'].includes(step) || 
                 ['select-type', 'upload', 'mapping', 'validate', 'import'].indexOf(step) > i
                  ? <Check className="h-4 w-4" />
                  : i + 1}
              </div>
              {i < 4 && (
                <div className={`w-12 h-0.5 ${
                  ['select-type', 'upload', 'mapping', 'validate', 'import'].indexOf(step) > i
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
          <span>Type</span>
          <span>Upload</span>
          <span>Map</span>
          <span>Validate</span>
          <span>Import</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 'select-type' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>What would you like to import?</CardTitle>
            <CardDescription>
              Select the type of data you want to import from a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => handleTypeSelect('issues')}
              >
                <Upload className="h-8 w-8" />
                <span className="font-medium">Issues</span>
                <span className="text-xs text-muted-foreground">
                  Bugs, Stories, Tasks
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => handleTypeSelect('projects')}
              >
                <Upload className="h-8 w-8" />
                <span className="font-medium">Projects</span>
                <span className="text-xs text-muted-foreground">
                  Project configuration
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => handleTypeSelect('users')}
              >
                <Upload className="h-8 w-8" />
                <span className="font-medium">Users</span>
                <span className="text-xs text-muted-foreground">
                  User profiles
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file containing your {importType} data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
              <TabsList className="mb-4">
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>
            </Tabs>
            <CSVUploader onFileLoad={handleFileLoad} />
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <FieldMapper
            importType={importType}
            sourceHeaders={headers}
            mappings={mappings}
            onMappingChange={handleMappingChange}
          />
        </div>
      )}

      {step === 'validate' && validationResult && (
        <ValidationPreview
          result={validationResult}
          fieldMappings={mappings}
        />
      )}

      {step === 'import' && jobId && (
        <ImportProgress
          jobId={jobId}
          onComplete={handleImportComplete}
          onViewResults={onComplete}
        />
      )}

      {step === 'complete' && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Your data has been successfully imported.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => {
                setStep('select-type');
                setCsvContent('');
                setFileName('');
                setHeaders([]);
                setMappings({});
                setValidationResult(null);
                setJobId(null);
              }}>
                Import More Data
              </Button>
              <Button onClick={onComplete}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {!['select-type', 'import', 'complete'].includes(step) && (
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step === 'mapping' && (
            <Button onClick={handleValidate} disabled={!canProceed() || isValidating}>
              {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Validate Data
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          
          {step === 'validate' && (
            <Button 
              onClick={handleStartImport} 
              disabled={!validationResult?.validRows || isImporting}
            >
              {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Start Import ({validationResult?.validRows} records)
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
