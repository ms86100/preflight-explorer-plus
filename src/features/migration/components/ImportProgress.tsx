import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getImportStatus } from "../services/importService";
import type { ImportJob, ImportError } from "../types";

interface ImportProgressProps {
  readonly jobId: string;
  readonly onComplete: () => void;
  readonly onViewResults: () => void;
}

export function ImportProgress({ jobId, onComplete, onViewResults }: ImportProgressProps) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const errorShownRef = useRef(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const status = await getImportStatus(jobId);
        setJob(status.job);
        setErrors(status.errors || []);

        if (status.job.status === 'completed' || status.job.status === 'failed') {
          setIsPolling(false);
          onComplete();
        }
      } catch (error) {
        console.error('Failed to get import status:', error);
        // Show toast only once to avoid spamming during polling
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          toast.error('Unable to fetch import status. Will retry automatically.');
        }
      }
    };

    pollStatus();

    if (isPolling) {
      intervalId = setInterval(pollStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId, isPolling, onComplete]);

  if (!job) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const progress = job.total_records > 0 
    ? Math.round((job.processed_records / job.total_records) * 100) 
    : 0;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircle className="h-8 w-8 text-destructive" />;
      case 'importing':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'completed':
        return 'Import Complete';
      case 'failed':
        return 'Import Failed';
      case 'importing':
        return 'Importing...';
      case 'validated':
        return 'Ready to Import';
      default:
        return job.status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {getStatusIcon()}
            <h3 className="text-xl font-semibold mt-4">{getStatusText()}</h3>
            <p className="text-muted-foreground mt-1">
              {job.file_name}
            </p>
          </div>

          {/* Progress Bar */}
          {(job.status === 'importing' || job.status === 'completed') && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {job.processed_records} of {job.total_records} records processed
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{job.total_records}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 bg-green-100 dark:bg-green-950/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{job.successful_records}</p>
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
            <div className="text-center p-3 bg-red-100 dark:bg-red-950/20 rounded-lg">
              <p className="text-2xl font-bold text-destructive">{job.failed_records}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {job.error_message && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{job.error_message}</p>
            </div>
          )}

          {job.status === 'completed' && (
            <div className="mt-6 flex justify-center">
              <Button onClick={onViewResults}>
                View Import Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-lg">Import Errors ({errors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-3 p-2 rounded bg-destructive/10"
                  >
                    <Badge variant="outline" className="shrink-0">
                      Row {error.row_number}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{error.error_message}</p>
                      {error.field_name && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {error.field_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <div className="flex justify-center gap-8 text-xs text-muted-foreground">
        {job.started_at && (
          <p>Started: {new Date(job.started_at).toLocaleString()}</p>
        )}
        {job.completed_at && (
          <p>Completed: {new Date(job.completed_at).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
