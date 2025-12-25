import React from 'react';
import { cn } from '@/lib/utils';
import { DocSection } from '../types';
import { Book, Layers, GitBranch, Database, Cpu, Rocket } from 'lucide-react';

interface DocNavigationProps {
  activeSection: DocSection;
  onSectionChange: (section: DocSection) => void;
}

const sections: { id: DocSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Book },
  { id: 'modules', label: 'Modules', icon: Layers },
  { id: 'diagrams', label: 'Diagrams', icon: GitBranch },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'tech-stack', label: 'Tech Stack', icon: Cpu },
  { id: 'deployment', label: 'Deployment', icon: Rocket },
];

export const DocNavigation: React.FC<DocNavigationProps> = ({
  activeSection,
  onSectionChange,
}) => {
  return (
    <nav className="space-y-1">
      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Documentation
      </h3>
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-4 h-4" />
            {section.label}
          </button>
        );
      })}
    </nav>
  );
};
