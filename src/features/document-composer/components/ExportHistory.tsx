import React, { useState } from 'react';
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
import type { ExportJob, ExportFormat } from '../types';

export function ExportHistory() {
  const [exports] = useState<ExportJob[]>([
    {
      id: '1',
      status: 'completed',
      format: 'pdf',
      issueCount: 15,
      progress: 100,
      fileUrl: '#',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    },
    {
      id: '2',
      status: 'completed',
      format: 'xlsx',
      issueCount: 42,
      progress: 100,
      fileUrl: '#',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60).toISOString(),
    },
    {
      id: '3',
      status: 'failed',
      format: 'docx',
      issueCount: 8,
      progress: 45,
      error: 'Export timeout - too many attachments',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: '4',
      status: 'processing',
      format: 'pdf',
      issueCount: 23,
      progress: 67,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ]);

  const formatIcons: Record<string, React.ReactNode> = {
    pdf: <FileText className="h-4 w-4 text-red-500" />,
    xlsx: <TableIcon className="h-4 w-4 text-green-500" />,
    docx: <FileType className="h-4 w-4 text-blue-500" />,
    html: <FileText className="h-4 w-4 text-orange-500" />,
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
            <TableHead>Format</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exports.map((exportJob) => (
            <TableRow key={exportJob.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatIcons[exportJob.format]}
                  <span className="uppercase text-sm font-medium">{exportJob.format}</span>
                </div>
              </TableCell>
              <TableCell>{exportJob.issueCount} items</TableCell>
              <TableCell>
                <Badge variant={statusConfig[exportJob.status].variant} className="gap-1">
                  {statusConfig[exportJob.status].icon}
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
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {exportJob.status === 'failed' && (
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
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
