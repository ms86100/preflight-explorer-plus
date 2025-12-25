export interface ModuleDoc {
  id: string;
  name: string;
  description: string;
  purpose: string;
  components: string[];
  hooks: string[];
  services: string[];
  userFlow: string[];
  roles: {
    admin: string[];
    user: string[];
  };
  preconditions: string[];
  postconditions: string[];
  edgeCases: string[];
}

export interface DiagramData {
  id: string;
  title: string;
  type: 'flow' | 'sequence' | 'erd' | 'mindmap' | 'architecture';
  description: string;
  mermaidCode: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
    description: string;
  }[];
  relationships: {
    table: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    foreignKey: string;
  }[];
  rlsPolicies: string[];
}

export interface TechStackItem {
  category: string;
  name: string;
  version?: string;
  description: string;
  purpose: string;
}

export type DocSection = 
  | 'overview' 
  | 'modules' 
  | 'diagrams' 
  | 'database' 
  | 'tech-stack' 
  | 'deployment';
