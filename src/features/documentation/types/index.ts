export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
  authentication: 'required' | 'optional' | 'none';
}

export interface ImplementationDetail {
  area: string;
  description: string;
  status: 'implemented' | 'partial' | 'planned';
}

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
  associatedDiagrams?: string[];
  apiDocumentation?: ApiEndpoint[];
  implementationDetails?: ImplementationDetail[];
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
  | 'database' 
  | 'tech-stack' 
  | 'deployment';


// Gap Analysis Types
export type CompletionStatus = 'complete' | 'partial' | 'gap' | 'not-applicable';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type DossierCategory = 
  | 'functional' 
  | 'architecture' 
  | 'technical' 
  | 'nfr' 
  | 'operations' 
  | 'testing' 
  | 'knowledge-transfer' 
  | 'governance';

export interface CompletionChecklistItem {
  id: string;
  category: DossierCategory;
  subcategory: string;
  requirement: string;
  status: CompletionStatus;
  evidence?: string;
  gapDescription?: string;
  remediationPlan?: string;
  priority: Priority;
  estimatedEffort?: string;
  owner?: string;
}

export interface DossierSummary {
  category: DossierCategory;
  title: string;
  description: string;
  totalItems: number;
  completeCount: number;
  partialCount: number;
  gapCount: number;
  completionPercentage: number;
}
