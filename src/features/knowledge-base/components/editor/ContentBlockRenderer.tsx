import React from 'react';
import { cn } from '@/lib/utils';
import { Info, CheckCircle, AlertTriangle, AlertCircle, FileText } from 'lucide-react';
import type { ContentBlock } from '../../types';

interface ContentBlockRendererProps {
  readonly block: ContentBlock;
  readonly isEditing?: boolean;
}

const calloutIcons = {
  info: <Info className="h-5 w-5 text-info" />,
  success: <CheckCircle className="h-5 w-5 text-success" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  error: <AlertCircle className="h-5 w-5 text-destructive" />,
  note: <FileText className="h-5 w-5 text-muted-foreground" />,
};

const calloutStyles = {
  info: 'bg-info/10 border-info/30',
  success: 'bg-success/10 border-success/30',
  warning: 'bg-warning/10 border-warning/30',
  error: 'bg-destructive/10 border-destructive/30',
  note: 'bg-muted border-border',
};

export function ContentBlockRenderer({ block, isEditing = false }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock content={block.content} />;
    
    case 'heading':
      return (
        <HeadingBlock 
          content={block.content} 
          level={block.attributes.level ?? 1} 
        />
      );
    
    case 'list':
      return (
        <ListBlock 
          content={block.content} 
          listType={block.attributes.listType ?? 'unordered'} 
        />
      );
    
    case 'code':
      return (
        <CodeBlock 
          content={block.content} 
          language={block.attributes.language} 
        />
      );
    
    case 'quote':
      return <QuoteBlock content={block.content} />;
    
    case 'callout':
      return (
        <CalloutBlock 
          content={block.content} 
          calloutType={block.attributes.calloutType ?? 'info'} 
        />
      );
    
    case 'divider':
      return <DividerBlock />;
    
    case 'image':
      return (
        <ImageBlock 
          imageUrl={block.attributes.imageUrl} 
          imageAlt={block.attributes.imageAlt} 
        />
      );
    
    case 'table':
      return <TableBlock tableData={block.attributes.tableData} />;
    
    default:
      return (
        <div className="p-2 bg-muted rounded text-sm text-muted-foreground">
          Unknown block type: {block.type}
        </div>
      );
  }
}

// ============================================
// Individual Block Components
// ============================================

interface ParagraphBlockProps {
  readonly content: string;
}

function ParagraphBlock({ content }: ParagraphBlockProps) {
  if (!content) {
    return <p className="text-muted-foreground italic">Empty paragraph</p>;
  }
  
  return (
    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
      {content}
    </p>
  );
}

interface HeadingBlockProps {
  readonly content: string;
  readonly level: number;
}

function HeadingBlock({ content, level }: HeadingBlockProps) {
  const Tag = `h${Math.min(Math.max(level, 1), 6)}` as keyof JSX.IntrinsicElements;
  
  const sizeClasses: Record<number, string> = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-medium',
    5: 'text-base font-medium',
    6: 'text-sm font-medium uppercase tracking-wide',
  };
  
  return (
    <Tag className={cn(sizeClasses[level] ?? sizeClasses[1], 'text-foreground')}>
      {content || 'Untitled'}
    </Tag>
  );
}

interface ListBlockProps {
  readonly content: string;
  readonly listType: 'ordered' | 'unordered' | 'task';
}

function ListBlock({ content, listType }: ListBlockProps) {
  const items = content.split('\n').filter(Boolean);
  
  if (listType === 'task') {
    return (
      <ul className="space-y-1">
        {items.map((item, index) => {
          const isChecked = item.startsWith('- [x]') || item.startsWith('[x]');
          const text = item.replace(/^-?\s*\[[ x]\]\s*/, '');
          
          return (
            <li key={`task-${index}-${text.slice(0, 10)}`} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={isChecked}
                readOnly
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span className={cn(isChecked && 'line-through text-muted-foreground')}>
                {text}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
  
  const ListTag = listType === 'ordered' ? 'ol' : 'ul';
  const listClass = listType === 'ordered' 
    ? 'list-decimal list-inside space-y-1' 
    : 'list-disc list-inside space-y-1';
  
  return (
    <ListTag className={listClass}>
      {items.map((item, index) => {
        const text = item.replace(/^[-*\d.]\s*/, '');
        return (
          <li key={`item-${index}-${text.slice(0, 10)}`}>{text}</li>
        );
      })}
    </ListTag>
  );
}

interface CodeBlockProps {
  readonly content: string;
  readonly language?: string;
}

function CodeBlock({ content, language }: CodeBlockProps) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-border">
      {language && (
        <div className="px-3 py-1.5 bg-muted text-xs text-muted-foreground font-mono border-b border-border">
          {language}
        </div>
      )}
      <pre className="p-4 overflow-x-auto bg-muted/50">
        <code className="text-sm font-mono text-foreground">
          {content || '// Enter code here'}
        </code>
      </pre>
    </div>
  );
}

interface QuoteBlockProps {
  readonly content: string;
}

function QuoteBlock({ content }: QuoteBlockProps) {
  return (
    <blockquote className="border-l-4 border-primary pl-4 py-1 italic text-muted-foreground">
      {content || 'Enter quote...'}
    </blockquote>
  );
}

interface CalloutBlockProps {
  readonly content: string;
  readonly calloutType: 'info' | 'success' | 'warning' | 'error' | 'note';
}

function CalloutBlock({ content, calloutType }: CalloutBlockProps) {
  const icon = calloutIcons[calloutType] ?? calloutIcons.info;
  const style = calloutStyles[calloutType] ?? calloutStyles.info;
  
  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border', style)}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 text-sm">
        {content || 'Enter callout content...'}
      </div>
    </div>
  );
}

function DividerBlock() {
  return <hr className="border-t border-border my-2" />;
}

interface ImageBlockProps {
  readonly imageUrl?: string;
  readonly imageAlt?: string;
}

function ImageBlock({ imageUrl, imageAlt }: ImageBlockProps) {
  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-40 bg-muted rounded-lg border border-dashed border-border">
        <span className="text-sm text-muted-foreground">
          Click to add an image
        </span>
      </div>
    );
  }
  
  return (
    <figure className="rounded-lg overflow-hidden">
      <img 
        src={imageUrl} 
        alt={imageAlt ?? 'Image'} 
        className="w-full h-auto object-cover"
      />
      {imageAlt && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2">
          {imageAlt}
        </figcaption>
      )}
    </figure>
  );
}

interface TableBlockProps {
  readonly tableData?: {
    headers: string[];
    rows: string[][];
    hasHeader: boolean;
  };
}

function TableBlock({ tableData }: TableBlockProps) {
  if (!tableData || tableData.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 bg-muted rounded-lg border border-dashed border-border">
        <span className="text-sm text-muted-foreground">
          Click to configure table
        </span>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        {tableData.hasHeader && tableData.headers.length > 0 && (
          <thead className="bg-muted">
            <tr>
              {tableData.headers.map((header, index) => (
                <th 
                  key={`header-${index}`}
                  className="px-4 py-2 text-left font-medium border-b border-border"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="border-b border-border last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
