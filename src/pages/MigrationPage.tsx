import { useState } from "react";
import { Upload, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout";
import { ImportWizard, ImportHistory, ImportProgress } from "@/features/migration";

export default function MigrationPage() {
  const [activeTab, setActiveTab] = useState<"import" | "history">("import");
  const [viewingJobId, setViewingJobId] = useState<string | null>(null);

  const handleViewJob = (jobId: string) => {
    setViewingJobId(jobId);
  };

  const handleBackFromJob = () => {
    setViewingJobId(null);
  };

  return (
    <AppLayout>
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Data Migration</h1>
            <p className="text-muted-foreground mt-1">
              Import data from CSV files to migrate from Jira or other systems
            </p>
          </div>

          {viewingJobId ? (
            <div className="space-y-4">
              <Button variant="ghost" onClick={handleBackFromJob}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to History
              </Button>
              <ImportProgress
                jobId={viewingJobId}
                onComplete={() => {}}
                onViewResults={handleBackFromJob}
              />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "import" | "history")}>
              <TabsList className="mb-6">
                <TabsTrigger value="import" className="gap-2">
                  <Upload className="h-4 w-4" />
                  New Import
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Import History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="import">
                <ImportWizard onComplete={() => setActiveTab("history")} />
              </TabsContent>

              <TabsContent value="history">
                <ImportHistory onViewJob={handleViewJob} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
