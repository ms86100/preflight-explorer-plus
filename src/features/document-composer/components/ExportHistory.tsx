import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, Table as TableIcon, FileType, Download, 
  CheckCircle, Clock, AlertCircle, Trash2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { getExports, deleteExport, downloadExport } from '../services/documentComposerService';
import type { ExportJob } from '../types';

export function ExportHistory() {
  const queryClient = useQueryClient();
  
  const { data: exports = [], isLoading } = useQuery({
    queryKey: ['document-exports'],
    queryFn: getExports,
    refetchInterval: 3000, // Poll for status updates
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-exports'] });
      toast.success('Export deleted');
    },
    onError: () => {
      toast.error('Failed to delete export');
    },
  });

  const handleDownload = async (exportJob: ExportJob) => {
    try {
      await downloadExport(exportJob);
      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
      console.error('Download error:', error);
    }
  };

  const formatIcons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-4 w-4 text-red-500" />,
    xlsx: <TableIcon className="h-4 w-4 text-green-500" />,
    docx: <FileType className="h-4 w-4 text-blue-500" />,
    html: <FileText className="h-4 w-4 text-orange-500" />,
    csv: <TableIcon className="h-4 w-4 text-green-600" />,
    json: <FileText className="h-4 w-4 text-yellow-500" />,
  };

  const statusConfig: Record<ExportJob['status'], { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { icon: <Clock className="h-3 w-3" />, variant: 'outline' },
    processing: { icon: <RefreshCw className="h-3 w-3 animate-spin" />, variant: 'secondary' },
    completed: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default' },
    failed: { icon: <AlertCircle className="h-3 w-3" />, variant: 'destructive' },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading export history...</p>
        </CardContent>
      </Card>
    );
  }

  if (exports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">No Export History</h3>
          <p className="text-sm text-muted-foreground">
            Your export history will appear here once you generate documents
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exports.map((exportJob) => (
            <TableRow key={exportJob.id}>
              <TableCell className="font-medium">
                {exportJob.name || 'Untitled Export'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatIcons[exportJob.format] || <FileText className="h-4 w-4" />}
                  <span className="uppercase text-sm font-medium">{exportJob.format}</span>
                </div>
              </TableCell>
              <TableCell>{exportJob.issueCount || exportJob.issue_ids?.length || 0} items</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatFileSize(exportJob.file_size)}
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig[exportJob.status]?.variant || 'outline'} className="gap-1">
                  {statusConfig[exportJob.status]?.icon}
                  <span className="capitalize">{exportJob.status}</span>
                </Badge>
                {exportJob.status === 'processing' && (
                  <span className="ml-2 text-xs text-muted-foreground">{exportJob.progress}%</span>
                )}
                {exportJob.error && (
                  <p className="text-xs text-destructive mt-1">{exportJob.error}</p>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(exportJob.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {exportJob.status === 'completed' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(exportJob)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {exportJob.status === 'failed' && (
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(exportJob.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
