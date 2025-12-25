import React, { useState } from 'react';
import { DocNavigation } from './DocNavigation';
import { OverviewSection } from './OverviewSection';
import { ModulesSection } from './ModulesSection';
import { DatabaseSection } from './DatabaseSection';
import { TechStackSection } from './TechStackSection';
import { DeploymentSection } from './DeploymentSection';
import { DocSection } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export const DocumentationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocSection>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'modules':
        return <ModulesSection />;
      case 'database':
        return <DatabaseSection />;
      case 'tech-stack':
        return <TechStackSection />;
      case 'deployment':
        return <DeploymentSection />;
      default:
        return <OverviewSection />;
    }
  };

  const handleSectionChange = (section: DocSection) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          {isMobile && (
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <DocNavigation
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                />
              </SheetContent>
            </Sheet>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Button>
          <div className="flex-1" />
          <span className="text-sm font-medium hidden md:inline">Vertex PM Documentation</span>
        </div>
      </header>

      <div className="container flex">
        {!isMobile && (
          <aside className="w-64 flex-shrink-0 border-r">
            <ScrollArea className="h-[calc(100vh-3.5rem)] py-6 pr-4">
              <DocNavigation
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
              />
            </ScrollArea>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="py-6 px-4 md:px-8 max-w-4xl">
              {renderSection()}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};
