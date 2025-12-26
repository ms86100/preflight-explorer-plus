import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare,
  Code,
  Quote,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Minus,
  Image,
  Table,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentBlockType } from '../../types';

export interface SlashCommand {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly blockType: ContentBlockType;
  readonly attributes?: Record<string, unknown>;
  readonly category: 'text' | 'list' | 'media' | 'advanced';
}

const commands: SlashCommand[] = [
  // Text blocks
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Plain text paragraph',
    icon: <Type className="h-4 w-4" />,
    blockType: 'paragraph',
    category: 'text',
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 className="h-4 w-4" />,
    blockType: 'heading',
    attributes: { level: 1 },
    category: 'text',
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 className="h-4 w-4" />,
    blockType: 'heading',
    attributes: { level: 2 },
    category: 'text',
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 className="h-4 w-4" />,
    blockType: 'heading',
    attributes: { level: 3 },
    category: 'text',
  },
  // Lists
  {
    id: 'bullet-list',
    label: 'Bullet List',
    description: 'Unordered list with bullets',
    icon: <List className="h-4 w-4" />,
    blockType: 'list',
    attributes: { listType: 'unordered' },
    category: 'list',
  },
  {
    id: 'numbered-list',
    label: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: <ListOrdered className="h-4 w-4" />,
    blockType: 'list',
    attributes: { listType: 'ordered' },
    category: 'list',
  },
  {
    id: 'task-list',
    label: 'Task List',
    description: 'Checklist with checkboxes',
    icon: <CheckSquare className="h-4 w-4" />,
    blockType: 'list',
    attributes: { listType: 'task' },
    category: 'list',
  },
  // Advanced
  {
    id: 'code',
    label: 'Code Block',
    description: 'Display code with syntax highlighting',
    icon: <Code className="h-4 w-4" />,
    blockType: 'code',
    category: 'advanced',
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote or citation',
    icon: <Quote className="h-4 w-4" />,
    blockType: 'quote',
    category: 'advanced',
  },
  {
    id: 'callout-info',
    label: 'Info Callout',
    description: 'Blue informational callout',
    icon: <Info className="h-4 w-4 text-info" />,
    blockType: 'callout',
    attributes: { calloutType: 'info' },
    category: 'advanced',
  },
  {
    id: 'callout-success',
    label: 'Success Callout',
    description: 'Green success callout',
    icon: <CheckCircle className="h-4 w-4 text-success" />,
    blockType: 'callout',
    attributes: { calloutType: 'success' },
    category: 'advanced',
  },
  {
    id: 'callout-warning',
    label: 'Warning Callout',
    description: 'Yellow warning callout',
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    blockType: 'callout',
    attributes: { calloutType: 'warning' },
    category: 'advanced',
  },
  {
    id: 'callout-error',
    label: 'Error Callout',
    description: 'Red error callout',
    icon: <AlertCircle className="h-4 w-4 text-destructive" />,
    blockType: 'callout',
    attributes: { calloutType: 'error' },
    category: 'advanced',
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal divider line',
    icon: <Minus className="h-4 w-4" />,
    blockType: 'divider',
    category: 'advanced',
  },
  // Media
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or embed an image',
    icon: <Image className="h-4 w-4" />,
    blockType: 'image',
    category: 'media',
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Insert a table',
    icon: <Table className="h-4 w-4" />,
    blockType: 'table',
    category: 'media',
  },
];

interface SlashCommandMenuProps {
  readonly isOpen: boolean;
  readonly position: { top: number; left: number };
  readonly searchQuery: string;
  readonly onSelect: (command: SlashCommand) => void;
  readonly onClose: () => void;
}

export function SlashCommandMenu({
  isOpen,
  position,
  searchQuery,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!searchQuery) {
      return commands;
    }
    const query = searchQuery.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, filteredCommands, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || filteredCommands.length === 0) {
    return null;
  }

  // Group commands by category
  const groupedCommands = filteredCommands.reduce<Record<string, SlashCommand[]>>(
    (acc, cmd) => {
      const category = cmd.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(cmd);
      return acc;
    },
    {}
  );

  const categoryLabels: Record<string, string> = {
    text: 'Text',
    list: 'Lists',
    media: 'Media',
    advanced: 'Advanced',
  };

  let globalIndex = 0;

  return (
    <div
      className="fixed z-50 w-72 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in"
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Insert block"
    >
      <div className="max-h-80 overflow-y-auto p-1">
        {Object.entries(groupedCommands).map(([category, cmds]) => (
          <div key={category}>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {categoryLabels[category] ?? category}
            </div>
            {cmds.map((command) => {
              const currentIndex = globalIndex++;
              const isSelected = currentIndex === selectedIndex;
              
              return (
                <button
                  key={command.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors',
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => onSelect(command)}
                  onMouseEnter={() => setSelectedIndex(currentIndex)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-muted">
                    {command.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{command.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {command.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 bg-background rounded border">↑↓</kbd> to navigate{' '}
        <kbd className="px-1 py-0.5 bg-background rounded border ml-2">↵</kbd> to select{' '}
        <kbd className="px-1 py-0.5 bg-background rounded border ml-2">esc</kbd> to close
      </div>
    </div>
  );
}

export { commands as slashCommands };
