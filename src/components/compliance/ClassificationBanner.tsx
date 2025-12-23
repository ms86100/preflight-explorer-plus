import { ClassificationLevel } from '@/types/jira';
import { cn } from '@/lib/utils';

interface ClassificationBannerProps {
  readonly level: ClassificationLevel;
  readonly className?: string;
}

const CLASSIFICATION_CONFIG: Record<ClassificationLevel, { label: string; className: string }> = {
  public: {
    label: 'UNCLASSIFIED // PUBLIC',
    className: 'classification-public',
  },
  restricted: {
    label: 'RESTRICTED // OFFICIAL USE ONLY',
    className: 'classification-restricted',
  },
  confidential: {
    label: 'CONFIDENTIAL // PROPRIETARY',
    className: 'classification-confidential',
  },
  export_controlled: {
    label: 'EXPORT CONTROLLED // ITAR/EAR',
    className: 'classification-export-controlled',
  },
};

export function ClassificationBanner({ level, className }: ClassificationBannerProps) {
  const config = CLASSIFICATION_CONFIG[level];
  
  return (
    <div className={cn('classification-banner', config.className, className)}>
      {config.label}
    </div>
  );
}

export function ClassificationBadge({ level, className }: ClassificationBannerProps) {
  const config = CLASSIFICATION_CONFIG[level];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      config.className,
      className
    )}>
      {level.replace('_', ' ').toUpperCase()}
    </span>
  );
}
