import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Folder, Code, Settings, Users } from 'lucide-react';
import { moduleDocumentation } from '../data/moduleDocumentation';

export const ModulesSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredModules = moduleDocumentation.filter(
    module =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Feature Modules</h1>
        <p className="text-muted-foreground">
          Complete documentation of all {moduleDocumentation.length} feature modules in the application.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Module Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Folder className="w-4 h-4" />
        <span>Showing {filteredModules.length} of {moduleDocumentation.length} modules</span>
      </div>

      {/* Module List */}
      <Accordion type="single" collapsible className="space-y-4">
        {filteredModules.map((module) => (
          <AccordionItem
            key={module.id}
            value={module.id}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{module.name}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-6">
              {/* Purpose */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Purpose & Business Intent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{module.purpose}</p>
                </CardContent>
              </Card>

              {/* File Structure */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    File Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Components</h4>
                      {module.components.length > 0 ? (
                        <ul className="space-y-1 text-muted-foreground">
                          {module.components.map((comp, i) => (
                            <li key={i} className="font-mono text-xs">{comp}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground italic">No components</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Hooks</h4>
                      {module.hooks.length > 0 ? (
                        <ul className="space-y-1 text-muted-foreground">
                          {module.hooks.map((hook, i) => (
                            <li key={i} className="font-mono text-xs">{hook}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground italic">No hooks</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Services</h4>
                      {module.services.length > 0 ? (
                        <ul className="space-y-1 text-muted-foreground">
                          {module.services.map((svc, i) => (
                            <li key={i} className="font-mono text-xs">{svc}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground italic">No services</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Flow */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">User Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {module.userFlow.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Role-Based Behavior */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Role-Based Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Role</TableHead>
                        <TableHead>Capabilities</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Badge variant="default">Admin</Badge>
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {module.roles.admin.map((cap, i) => (
                              <li key={i}>{cap}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="secondary">User</Badge>
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {module.roles.user.map((cap, i) => (
                              <li key={i}>{cap}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Conditions */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Preconditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {module.preconditions.map((pre, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500">•</span>
                          {pre}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Postconditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {module.postconditions.map((post, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          {post}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Edge Cases */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Edge Cases & Error Handling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {module.edgeCases.map((edge, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {edge}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
