import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Database, Key, Link2, Shield } from 'lucide-react';
import { coreTablesSchema, gitTablesSchema, workflowTablesSchema, tableCategories } from '../data/databaseSchema';

const allTables = [...coreTablesSchema, ...gitTablesSchema, ...workflowTablesSchema];

export const DatabaseSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTables = allTables.filter(
    table =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Database Schema</h1>
        <p className="text-muted-foreground">
          Complete documentation of the PostgreSQL database schema with relationships and RLS policies.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Database className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">80+</div>
            <div className="text-xs text-muted-foreground">Tables</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Key className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">UUID</div>
            <div className="text-xs text-muted-foreground">Primary Keys</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Link2 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">120+</div>
            <div className="text-xs text-muted-foreground">Relationships</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">RLS</div>
            <div className="text-xs text-muted-foreground">All Tables</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Table Categories</CardTitle>
          <CardDescription>Tables organized by functional area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tableCategories.map((category) => (
              <Badge key={category.name} variant="outline" className="text-sm py-1.5 px-3">
                {category.name}
                <span className="ml-2 text-muted-foreground">({category.count})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table Documentation */}
      <Accordion type="single" collapsible className="space-y-4">
        {filteredTables.map((table) => (
          <AccordionItem
            key={table.name}
            value={table.name}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-mono font-semibold">{table.name}</h3>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
              {/* Columns */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Columns</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Nullable</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.columns.map((column) => (
                        <TableRow key={column.name}>
                          <TableCell className="font-mono text-sm">{column.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {column.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {column.nullable ? (
                              <span className="text-muted-foreground">Yes</span>
                            ) : (
                              <span className="text-orange-600 dark:text-orange-400">No</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {column.default || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {column.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Relationships */}
              {table.relationships.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Relationships
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {table.relationships.map((rel, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="font-mono">
                            {rel.type}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono text-primary">{rel.table}</span>
                          <span className="text-muted-foreground">via</span>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {rel.foreignKey}
                          </code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RLS Policies */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    RLS Policies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {table.rlsPolicies.map((policy, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        {policy}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* RLS Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Row Level Security (RLS)</CardTitle>
          <CardDescription>
            All tables are protected with PostgreSQL Row Level Security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            RLS ensures that users can only access data they are authorized to see, regardless of how they access the database.
            Policies use <code className="bg-muted px-1 rounded">auth.uid()</code> to identify the current user.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Enabled Policies</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• SELECT: View data user has access to</li>
                <li>• INSERT: Create data user is authorized for</li>
                <li>• UPDATE: Modify own or assigned data</li>
                <li>• DELETE: Remove data with appropriate permissions</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Policy Patterns</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Owner-based: <code>user_id = auth.uid()</code></li>
                <li>• Project-based: Joined through project membership</li>
                <li>• Role-based: Admin vs regular user checks</li>
                <li>• Public: Accessible to all authenticated users</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
