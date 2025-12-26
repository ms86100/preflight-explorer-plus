import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ContentBlock } from '../../types';

interface EditableBlockProps {
  readonly block: ContentBlock;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
  readonly onChange: (content: string) => void;
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
  readonly onAddBlockAfter: () => void;
  readonly onDelete: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onDuplicate: () => void;
}

export function EditableBlock({
  block,
  isSelected,
  onSelect,
  onChange,
  onKeyDown,
  onAddBlockAfter,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: EditableBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus when selected
  useEffect(() => {
    if (isSelected && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isSelected]);

  const handleInput = useCallback(() => {
    if (contentRef.current) {
      onChange(contentRef.current.textContent ?? '');
    }
  }, [onChange]);

  const getPlaceholder = (): string => {
    switch (block.type) {
      case 'paragraph':
        return "Type '/' for commands...";
      case 'heading':
        return 'Heading';
      case 'code':
        return 'Enter code...';
      case 'quote':
        return 'Enter quote...';
      case 'callout':
        return 'Enter callout content...';
      case 'list':
        return 'List item...';
      default:
        return 'Type something...';
    }
  };

  const getBlockStyles = (): string => {
    switch (block.type) {
      case 'heading': {
        const levelStyles: Record<number, string> = {
          1: 'text-3xl font-bold',
          2: 'text-2xl font-semibold',
          3: 'text-xl font-semibold',
          4: 'text-lg font-medium',
          5: 'text-base font-medium',
          6: 'text-sm font-medium uppercase tracking-wide',
        };
        return levelStyles[block.attributes.level ?? 1] ?? levelStyles[1];
      }
      case 'code':
        return 'font-mono text-sm bg-muted p-3 rounded-lg';
      case 'quote':
        return 'border-l-4 border-primary pl-4 italic text-muted-foreground';
      case 'callout':
        return 'p-4 rounded-lg bg-info/10 border border-info/30';
      default:
        return '';
    }
  };

  // Non-editable blocks
  if (block.type === 'divider') {
    return (
      <div 
        className={cn(
          'group relative py-2',
          isSelected && 'ring-2 ring-primary ring-offset-2 rounded'
        )}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect();
          }
        }}
      >
        <BlockControls
          onAddBlockAfter={onAddBlockAfter}
          onDelete={onDelete}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
        />
        <hr className="border-t border-border" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative',
        isSelected && 'ring-2 ring-primary ring-offset-2 rounded'
      )}
      onClick={onSelect}
    >
      <BlockControls
        onAddBlockAfter={onAddBlockAfter}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
      />
      
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          'outline-none min-h-[1.5em] py-1 px-1 rounded',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground',
          'focus:bg-muted/30',
          getBlockStyles()
        )}
        data-placeholder={getPlaceholder()}
        onInput={handleInput}
        onKeyDown={onKeyDown}
        onFocus={onSelect}
        role="textbox"
        aria-label={`${block.type} block`}
      >
        {block.content}
      </div>
    </div>
  );
}

// ============================================
// Block Controls Component
// ============================================

interface BlockControlsProps {
  readonly onAddBlockAfter: () => void;
  readonly onDelete: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onDuplicate: () => void;
}

function BlockControls({
  onAddBlockAfter,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
}: BlockControlsProps) {
  return (
    <div className="absolute -left-16 top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          onAddBlockAfter();
        }}
        title="Add block below"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      <div className="cursor-grab active:cursor-grabbing" title="Drag to reorder">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onMoveUp}>
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMoveDown}>
            Move down
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
