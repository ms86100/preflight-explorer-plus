import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type ClassificationLevel = 'public' | 'restricted' | 'confidential' | 'export_controlled';

interface ClassificationBadgeProps {
  level: ClassificationLevel | null | undefined;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CLASSIFICATION_CONFIG: Record<ClassificationLevel, {
  label: string;
  icon: React.ReactNode;
  className: string;
  description: string;
}> = {
  public: {
    label: 'PUBLIC',
    icon: <Globe className="h-3 w-3" />,
    className: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    description: 'Publicly available information',
  },
  restricted: {
    label: 'RESTRICTED',
    icon: <Shield className="h-3 w-3" />,
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    description: 'Internal use only',
  },
  confidential: {
    label: 'CONFIDENTIAL',
    icon: <Lock className="h-3 w-3" />,
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    description: 'Sensitive business information',
  },
  export_controlled: {
    label: 'EXPORT CONTROLLED',
    icon: <AlertTriangle className="h-3 w-3" />,
    className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    description: 'Subject to export control regulations (ITAR/EAR)',
  },
};

export function ClassificationBadge({ 
  level, 
  showIcon = true, 
  size = 'md',
  className 
}: ClassificationBadgeProps) {
  if (!level) return null;

  const config = CLASSIFICATION_CONFIG[level];
  if (!config) return null;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        sizeClasses[size],
        'font-semibold tracking-wide',
        className
      )}
      title={config.description}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

interface ClassificationBannerProps {
  level: ClassificationLevel | null | undefined;
  className?: string;
}

export function ClassificationBanner({ level, className }: ClassificationBannerProps) {
  if (!level || level === 'public') return null;

  const config = CLASSIFICATION_CONFIG[level];
  if (!config) return null;

  return (
    <div 
      className={cn(
        'w-full py-1 px-4 text-center text-xs font-semibold tracking-widest',
        level === 'restricted' && 'bg-yellow-500/20 text-yellow-400 border-y border-yellow-500/30',
        level === 'confidential' && 'bg-orange-500/20 text-orange-400 border-y border-orange-500/30',
        level === 'export_controlled' && 'bg-red-500/20 text-red-400 border-y border-red-500/30',
        className
      )}
    >
      {config.label} - {config.description.toUpperCase()}
    </div>
  );
}

export function getClassificationLevel(level: string | null | undefined): ClassificationLevel | null {
  if (!level) return null;
  if (level in CLASSIFICATION_CONFIG) return level as ClassificationLevel;
  return null;
}

export { CLASSIFICATION_CONFIG };
export type { ClassificationLevel };
