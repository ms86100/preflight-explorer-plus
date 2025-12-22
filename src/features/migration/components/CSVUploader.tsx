import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CSVUploaderProps {
  onFileLoad: (content: string, fileName: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function CSVUploader({ 
  onFileLoad, 
  accept = ".csv", 
  maxSize = 10 
}: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileName(file.name);
      onFileLoad(content, file.name);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, [maxSize, onFileLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setFileName(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fileName ? (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">File loaded successfully</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className={cn(
              "h-12 w-12 mb-4 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="text-lg font-medium mb-1">
              Drop your CSV file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse (max {maxSize}MB)
            </p>
            <input
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="hidden"
              id="csv-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="csv-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
