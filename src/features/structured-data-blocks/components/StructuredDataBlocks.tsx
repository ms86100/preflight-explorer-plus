import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plus, Settings } from 'lucide-react';
import { SchemaEditor } from './SchemaEditor';
import { DataMatrixView } from './DataMatrixView';
import type { DataBlockSchema } from '../types';

export function StructuredDataBlocks() {
  const [activeTab, setActiveTab] = useState('blocks');
  const [schemas, setSchemas] = useState<DataBlockSchema[]>([
    {
      id: '1',
      name: 'Parts List',
      description: 'Track parts and quantities for manufacturing',
      version: 1,
      columns: [
        { key: 'partId', label: 'Part ID', type: 'string', required: true },
        { key: 'partName', label: 'Part Name', type: 'string', required: true },
        { key: 'quantity', label: 'Quantity', type: 'number', min: 1, required: true },
        { key: 'certified', label: 'Certified', type: 'boolean' },
        { key: 'status', label: 'Status', type: 'enum', options: ['Available', 'Ordered', 'Backordered'] },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
    },
    {
      id: '2',
      name: 'Test Cases',
      description: 'Test case tracking with results',
      version: 1,
      columns: [
        { key: 'testId', label: 'Test ID', type: 'string', required: true },
        { key: 'description', label: 'Description', type: 'string' },
        { key: 'result', label: 'Result', type: 'enum', options: ['Pass', 'Fail', 'Blocked', 'Not Run'] },
        { key: 'executedDate', label: 'Executed', type: 'date' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'system',
    },
  ]);

  const [selectedSchema, setSelectedSchema] = useState<DataBlockSchema | null>(null);

  const handleSchemaCreated = (schema: DataBlockSchema) => {
    setSchemas((prev) => [...prev, schema]);
  };

  const handleSchemaUpdated = (schema: DataBlockSchema) => {
    setSchemas((prev) => prev.map((s) => (s.id === schema.id ? schema : s)));
  };

  const handleSchemaDeleted = (id: string) => {
    setSchemas((prev) => prev.filter((s) => s.id !== id));
    if (selectedSchema?.id === id) {
      setSelectedSchema(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Structured Data Blocks
          </h2>
          <p className="text-sm text-muted-foreground">
            Define and manage schema-based data matrices for work items
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="blocks">Data Blocks</TabsTrigger>
          <TabsTrigger value="schemas">Schema Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-4">
          {selectedSchema ? (
            <DataMatrixView 
              schema={selectedSchema} 
              onBack={() => setSelectedSchema(null)} 
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schemas.map((schema) => (
                <Card 
                  key={schema.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedSchema(schema)}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      {schema.name}
                    </CardTitle>
                    <CardDescription>
                      {schema.columns.length} columns • v{schema.version}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {schema.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {schema.columns.slice(0, 3).map((col) => (
                        <span 
                          key={col.key} 
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {col.label}
                        </span>
                      ))}
                      {schema.columns.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{schema.columns.length - 3} more
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card 
                className="cursor-pointer border-dashed hover:border-primary/50 transition-colors flex items-center justify-center min-h-[180px]"
                onClick={() => setActiveTab('schemas')}
              >
                <CardContent className="text-center py-6">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Create New Schema</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schemas">
          <SchemaEditor 
            schemas={schemas}
            onSchemaCreated={handleSchemaCreated}
            onSchemaUpdated={handleSchemaUpdated}
            onSchemaDeleted={handleSchemaDeleted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
