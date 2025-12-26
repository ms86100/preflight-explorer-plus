import React from 'react';
import { useSpaces } from '../hooks/useKnowledgeBase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Book, Users, FileText, FolderOpen } from 'lucide-react';
import type { SpaceWithStats, SpaceType } from '../types';

const spaceTypeIcons: Record<SpaceType, React.ReactNode> = {
  team: <Users className="h-5 w-5" />,
  project: <FolderOpen className="h-5 w-5" />,
  personal: <FileText className="h-5 w-5" />,
  documentation: <Book className="h-5 w-5" />,
};

interface SpaceCardProps {
  readonly space: SpaceWithStats;
  readonly onSelect: (space: SpaceWithStats) => void;
}

function SpaceCard({ space, onSelect }: SpaceCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
      onClick={() => onSelect(space)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(space);
        }
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: space.color ? `${space.color}20` : undefined }}
            >
              {space.icon ?? spaceTypeIcons[space.type]}
            </div>
            <div>
              <CardTitle className="text-base">{space.name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {space.key}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {space.description}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{space.page_count} pages</span>
          <span>{space.member_count} members</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface SpacesListProps {
  readonly onSpaceSelect: (space: SpaceWithStats) => void;
  readonly onCreateSpace: () => void;
}

export function SpacesList({ onSpaceSelect, onCreateSpace }: SpacesListProps) {
  const { data: spaces, isLoading, error } = useSpaces();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader>
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load spaces. Please try again.
      </div>
    );
  }

  const activeSpaces = spaces?.filter((s) => s.status === 'active') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Spaces</h2>
          <p className="text-muted-foreground">
            Browse and manage your knowledge bases
          </p>
        </div>
        <Button onClick={onCreateSpace}>
          <Plus className="h-4 w-4 mr-2" />
          Create Space
        </Button>
      </div>

      {activeSpaces.length === 0 ? (
        <Card className="p-12 text-center">
          <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No spaces yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first space to start building your knowledge base.
          </p>
          <Button onClick={onCreateSpace}>
            <Plus className="h-4 w-4 mr-2" />
            Create Space
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSpaces.map((space) => (
            <SpaceCard 
              key={space.id} 
              space={space} 
              onSelect={onSpaceSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
