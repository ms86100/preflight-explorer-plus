import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentComposer } from '@/features/document-composer';
import { StructuredDataBlocks } from '@/features/structured-data-blocks';
import { GuidedOperations } from '@/features/guided-operations';
import { FeatureGate } from '@/features/plugins';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Database, Zap } from 'lucide-react';

export default function PluginFeaturesPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <Tabs defaultValue="document-composer">
          <TabsList>
            <TabsTrigger value="document-composer" className="gap-2">
              <FileText className="h-4 w-4" />
              Document Composer
            </TabsTrigger>
            <TabsTrigger value="data-blocks" className="gap-2">
              <Database className="h-4 w-4" />
              Data Blocks
            </TabsTrigger>
            <TabsTrigger value="guided-ops" className="gap-2">
              <Zap className="h-4 w-4" />
              Guided Operations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="document-composer" className="mt-6">
            <FeatureGate feature="document-composer" showDisabledMessage>
              <DocumentComposer />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="data-blocks" className="mt-6">
            <FeatureGate feature="structured-data-blocks" showDisabledMessage>
              <StructuredDataBlocks />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="guided-ops" className="mt-6">
            <FeatureGate feature="guided-operations" showDisabledMessage>
              <GuidedOperations />
            </FeatureGate>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
