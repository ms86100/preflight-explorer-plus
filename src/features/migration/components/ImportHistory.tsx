import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImportHistory } from "../services/importService";
import type { ImportJob } from "../types";
import { formatDistanceToNow } from "date-fns";

interface ImportHistoryProps {
  onViewJob: (jobId: string) => void;
}

export function ImportHistory({ onViewJob }: ImportHistoryProps) {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getImportHistory();
        setJobs(history);
      } catch (error) {
        console.error('Failed to load import history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'importing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'importing':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'validated':
        return <Badge variant="outline">Ready</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No import history</h3>
          <p className="text-muted-foreground">
            Your import jobs will appear here once you start importing data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{job.file_name || 'Untitled'}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {job.import_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{job.total_records} records</span>
                      <span>•</span>
                      <span className="text-green-600">{job.successful_records} success</span>
                      {job.failed_records > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-destructive">{job.failed_records} failed</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(job.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewJob(job.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
