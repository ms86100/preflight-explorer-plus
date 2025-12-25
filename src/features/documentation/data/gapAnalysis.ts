import { CompletionChecklistItem, DossierCategory } from '../types';

export const gapAnalysisData: CompletionChecklistItem[] = [
  // 1️⃣ FUNCTIONAL DOSSIER
  {
    id: 'func-1',
    category: 'functional',
    subcategory: 'Scope & Objectives',
    requirement: 'In-scope and out-of-scope features documented',
    status: 'complete',
    evidence: 'moduleDocumentation.ts contains 23 modules with detailed scope',
    priority: 'high'
  },
  {
    id: 'func-2',
    category: 'functional',
    subcategory: 'Scope & Objectives',
    requirement: 'Success criteria (KPIs, OKRs) defined and measurable',
    status: 'partial',
    evidence: 'Reports module exists with velocity, burndown charts',
    gapDescription: 'No formal KPI definitions or measurement thresholds',
    remediationPlan: 'Define KPIs per module (e.g., issue resolution time < 2 days)',
    priority: 'medium',
    estimatedEffort: '2-3 days',
    owner: 'Product'
  },
  {
    id: 'func-3',
    category: 'functional',
    subcategory: 'Scope & Objectives',
    requirement: 'Regulatory & compliance objectives mapped (RBI, GDPR, ITAR)',
    status: 'partial',
    evidence: 'Classification levels exist (UNCLASSIFIED, CUI, SECRET, TOP_SECRET)',
    gapDescription: 'No formal mapping to specific regulations',
    remediationPlan: 'Create compliance mapping document per regulation',
    priority: 'high',
    estimatedEffort: '5-7 days',
    owner: 'Compliance'
  },
  {
    id: 'func-4',
    category: 'functional',
    subcategory: 'User Personas & Roles',
    requirement: 'All user personas identified',
    status: 'partial',
    evidence: 'Admin/User roles documented per module',
    gapDescription: 'No formal persona documentation (e.g., PM, Developer, QA)',
    remediationPlan: 'Create persona definitions with goals and pain points',
    priority: 'medium',
    estimatedEffort: '2 days',
    owner: 'Product'
  },
  {
    id: 'func-5',
    category: 'functional',
    subcategory: 'User Personas & Roles',
    requirement: 'Role-to-permission mapping validated',
    status: 'complete',
    evidence: 'Documented in moduleDocumentation.ts for each module',
    priority: 'high'
  },
  {
    id: 'func-6',
    category: 'functional',
    subcategory: 'User Personas & Roles',
    requirement: 'Least-privilege principle applied',
    status: 'complete',
    evidence: 'RLS policies enforce row-level access, admin/user separation',
    priority: 'critical'
  },
  {
    id: 'func-7',
    category: 'functional',
    subcategory: 'Functional Modules',
    requirement: 'Purpose & business value documented per module',
    status: 'complete',
    evidence: 'moduleDocumentation.ts contains purpose for all 23 modules',
    priority: 'high'
  },
  {
    id: 'func-8',
    category: 'functional',
    subcategory: 'Functional Modules',
    requirement: 'Entry & exit conditions documented',
    status: 'complete',
    evidence: 'Preconditions and postconditions in moduleDocumentation.ts',
    priority: 'high'
  },
  {
    id: 'func-9',
    category: 'functional',
    subcategory: 'Functional Modules',
    requirement: 'Happy path flow documented',
    status: 'complete',
    evidence: 'userFlow arrays document step-by-step flows',
    priority: 'high'
  },
  {
    id: 'func-10',
    category: 'functional',
    subcategory: 'Functional Modules',
    requirement: 'Exception & error handling documented',
    status: 'complete',
    evidence: 'edgeCases documented per module',
    priority: 'high'
  },
  {
    id: 'func-11',
    category: 'functional',
    subcategory: 'Workflows & Lifecycle',
    requirement: 'End-to-end workflow diagrams',
    status: 'complete',
    evidence: 'issue-lifecycle, sprint-planning diagrams exist',
    priority: 'high'
  },
  {
    id: 'func-12',
    category: 'functional',
    subcategory: 'Workflows & Lifecycle',
    requirement: 'State transition rules defined',
    status: 'complete',
    evidence: 'Workflow engine with transition validation implemented',
    priority: 'high'
  },
  {
    id: 'func-13',
    category: 'functional',
    subcategory: 'Workflows & Lifecycle',
    requirement: 'Audit trail enabled',
    status: 'complete',
    evidence: 'audit_logs table with RLS, issue_history tracking',
    priority: 'critical'
  },
  {
    id: 'func-14',
    category: 'functional',
    subcategory: 'Data Functional Model',
    requirement: 'Entity definitions (business meaning)',
    status: 'partial',
    evidence: '80+ database tables defined',
    gapDescription: 'No business glossary with plain-language definitions',
    remediationPlan: 'Create data dictionary with business context',
    priority: 'medium',
    estimatedEffort: '3-4 days',
    owner: 'Technical Writer'
  },
  {
    id: 'func-15',
    category: 'functional',
    subcategory: 'Data Functional Model',
    requirement: 'Retention & archival rules defined',
    status: 'gap',
    gapDescription: 'No data retention policies documented',
    remediationPlan: 'Define retention periods per data type, implement archive triggers',
    priority: 'high',
    estimatedEffort: '5-7 days',
    owner: 'DevOps'
  },
  {
    id: 'func-16',
    category: 'functional',
    subcategory: 'Reporting & Dashboards',
    requirement: 'All dashboards mapped to real data',
    status: 'complete',
    evidence: '17 report components with TanStack Query data fetching',
    priority: 'high'
  },
  {
    id: 'func-17',
    category: 'functional',
    subcategory: 'Reporting & Dashboards',
    requirement: 'Role-based visibility',
    status: 'complete',
    evidence: 'RLS policies filter data based on user access',
    priority: 'high'
  },

  // 2️⃣ ARCHITECTURE DOSSIER
  {
    id: 'arch-1',
    category: 'architecture',
    subcategory: 'System Architecture',
    requirement: 'High-level system architecture diagram',
    status: 'complete',
    evidence: 'system-architecture diagram in diagramsData.ts',
    priority: 'critical'
  },
  {
    id: 'arch-2',
    category: 'architecture',
    subcategory: 'System Architecture',
    requirement: 'Logical vs physical architecture separation',
    status: 'partial',
    evidence: 'Logical architecture documented',
    gapDescription: 'No physical deployment topology diagram',
    remediationPlan: 'Create physical deployment diagram showing servers, networks',
    priority: 'medium',
    estimatedEffort: '2 days',
    owner: 'DevOps'
  },
  {
    id: 'arch-3',
    category: 'architecture',
    subcategory: 'System Architecture',
    requirement: 'Deployment topology (DC / HA / DR)',
    status: 'gap',
    gapDescription: 'No HA/DR documentation',
    remediationPlan: 'Document deployment topology, failover procedures',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'DevOps'
  },
  {
    id: 'arch-4',
    category: 'architecture',
    subcategory: 'Component Architecture',
    requirement: 'UI components structure documented',
    status: 'complete',
    evidence: 'Feature-based modules in src/features/, components listed per module',
    priority: 'high'
  },
  {
    id: 'arch-5',
    category: 'architecture',
    subcategory: 'Component Architecture',
    requirement: 'Backend services decomposition',
    status: 'complete',
    evidence: 'Edge functions documented, services per module',
    priority: 'high'
  },
  {
    id: 'arch-6',
    category: 'architecture',
    subcategory: 'Integration Architecture',
    requirement: 'Upstream & downstream systems listed',
    status: 'partial',
    evidence: 'Git and LDAP integrations documented',
    gapDescription: 'No comprehensive integration map',
    remediationPlan: 'Create integration matrix with all external systems',
    priority: 'medium',
    estimatedEffort: '2 days',
    owner: 'Technical Lead'
  },
  {
    id: 'arch-7',
    category: 'architecture',
    subcategory: 'Integration Architecture',
    requirement: 'Interface contracts (OpenAPI / WSDL)',
    status: 'partial',
    evidence: 'Edge functions have typed inputs/outputs',
    gapDescription: 'No formal OpenAPI documentation',
    remediationPlan: 'Generate OpenAPI specs for all edge functions',
    priority: 'medium',
    estimatedEffort: '3-4 days',
    owner: 'Backend'
  },
  {
    id: 'arch-8',
    category: 'architecture',
    subcategory: 'Data Architecture',
    requirement: 'ER diagrams (logical & physical)',
    status: 'complete',
    evidence: 'core-erd, git-erd diagrams exist',
    priority: 'high'
  },
  {
    id: 'arch-9',
    category: 'architecture',
    subcategory: 'Data Architecture',
    requirement: 'Indexing strategy documented',
    status: 'gap',
    gapDescription: 'No indexing strategy documentation',
    remediationPlan: 'Audit queries, document index usage, add missing indexes',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'DBA'
  },
  {
    id: 'arch-10',
    category: 'architecture',
    subcategory: 'Security Architecture',
    requirement: 'Authentication flows documented',
    status: 'complete',
    evidence: 'user-authentication-flow sequence diagram',
    priority: 'critical'
  },
  {
    id: 'arch-11',
    category: 'architecture',
    subcategory: 'Security Architecture',
    requirement: 'Row Level Security (RLS) enforced',
    status: 'complete',
    evidence: 'RLS policies on all user-facing tables',
    priority: 'critical'
  },
  {
    id: 'arch-12',
    category: 'architecture',
    subcategory: 'Security Architecture',
    requirement: 'Threat model completed',
    status: 'gap',
    gapDescription: 'No formal threat model document',
    remediationPlan: 'Conduct threat modeling workshop, document attack vectors',
    priority: 'high',
    estimatedEffort: '5-7 days',
    owner: 'Security'
  },

  // 3️⃣ TECHNICAL DOSSIER
  {
    id: 'tech-1',
    category: 'technical',
    subcategory: 'Codebase Quality',
    requirement: 'Feature-based modular architecture',
    status: 'complete',
    evidence: 'src/features/ structure with 20+ feature modules',
    priority: 'high'
  },
  {
    id: 'tech-2',
    category: 'technical',
    subcategory: 'Codebase Quality',
    requirement: 'No circular dependencies',
    status: 'partial',
    evidence: 'Architecture supports isolation',
    gapDescription: 'No automated circular dependency check',
    remediationPlan: 'Add madge or similar to CI pipeline',
    priority: 'medium',
    estimatedEffort: '1 day',
    owner: 'DevOps'
  },
  {
    id: 'tech-3',
    category: 'technical',
    subcategory: 'Codebase Quality',
    requirement: 'Static analysis clean (Sonar, etc.)',
    status: 'partial',
    evidence: 'ESLint configured, SonarCloud mentioned',
    gapDescription: 'No recent scan results documented',
    remediationPlan: 'Run SonarCloud scan, document baseline',
    priority: 'medium',
    estimatedEffort: '1 day',
    owner: 'DevOps'
  },
  {
    id: 'tech-4',
    category: 'technical',
    subcategory: 'Backend Engineering',
    requirement: 'API versioning strategy',
    status: 'gap',
    gapDescription: 'No API versioning documented',
    remediationPlan: 'Define versioning strategy (URL path or header)',
    priority: 'medium',
    estimatedEffort: '2 days',
    owner: 'Backend'
  },
  {
    id: 'tech-5',
    category: 'technical',
    subcategory: 'Backend Engineering',
    requirement: 'Input validation (Zod / Schema)',
    status: 'complete',
    evidence: 'Zod schemas in validation.ts, form validation',
    priority: 'critical'
  },
  {
    id: 'tech-6',
    category: 'technical',
    subcategory: 'Frontend Engineering',
    requirement: 'State management strategy documented',
    status: 'complete',
    evidence: 'TanStack Query documented in techStackData.ts',
    priority: 'high'
  },
  {
    id: 'tech-7',
    category: 'technical',
    subcategory: 'Frontend Engineering',
    requirement: 'Accessibility (WCAG) compliance',
    status: 'gap',
    gapDescription: 'No accessibility audit or documentation',
    remediationPlan: 'Run axe-core audit, fix issues, document standards',
    priority: 'high',
    estimatedEffort: '5-7 days',
    owner: 'Frontend'
  },
  {
    id: 'tech-8',
    category: 'technical',
    subcategory: 'Frontend Engineering',
    requirement: 'Error & empty states implemented',
    status: 'complete',
    evidence: 'Error boundaries, loading states, empty states in components',
    priority: 'high'
  },
  {
    id: 'tech-9',
    category: 'technical',
    subcategory: 'Database & Persistence',
    requirement: 'Foreign keys enforced',
    status: 'complete',
    evidence: 'FK constraints in schema, Relationships in types.ts',
    priority: 'high'
  },
  {
    id: 'tech-10',
    category: 'technical',
    subcategory: 'Database & Persistence',
    requirement: 'RLS policies tested',
    status: 'partial',
    evidence: 'Policies exist on all tables',
    gapDescription: 'No documented RLS test coverage',
    remediationPlan: 'Create RLS test suite with different user contexts',
    priority: 'high',
    estimatedEffort: '3-4 days',
    owner: 'Backend'
  },
  {
    id: 'tech-11',
    category: 'technical',
    subcategory: 'Database & Persistence',
    requirement: 'Migrations versioned & reversible',
    status: 'complete',
    evidence: 'supabase/migrations/ with versioned files',
    priority: 'high'
  },

  // 4️⃣ NON-FUNCTIONAL REQUIREMENTS
  {
    id: 'nfr-1',
    category: 'nfr',
    subcategory: 'Performance',
    requirement: 'Load test scenarios defined',
    status: 'gap',
    gapDescription: 'No load testing documentation',
    remediationPlan: 'Define load test scenarios, set up k6 or similar',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'QA'
  },
  {
    id: 'nfr-2',
    category: 'nfr',
    subcategory: 'Performance',
    requirement: 'SLA benchmarks met',
    status: 'gap',
    gapDescription: 'No SLA definitions',
    remediationPlan: 'Define SLAs for response time, availability',
    priority: 'high',
    estimatedEffort: '2 days',
    owner: 'Product'
  },
  {
    id: 'nfr-3',
    category: 'nfr',
    subcategory: 'Scalability & Availability',
    requirement: 'Horizontal scaling tested',
    status: 'gap',
    gapDescription: 'No scaling test documentation',
    remediationPlan: 'Test with multiple instances, document scaling behavior',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'DevOps'
  },
  {
    id: 'nfr-4',
    category: 'nfr',
    subcategory: 'Scalability & Availability',
    requirement: 'Failover validated',
    status: 'gap',
    gapDescription: 'No failover testing documentation',
    remediationPlan: 'Test failover scenarios, document recovery procedures',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'DevOps'
  },
  {
    id: 'nfr-5',
    category: 'nfr',
    subcategory: 'Security & Compliance',
    requirement: 'OWASP Top 10 mitigated',
    status: 'partial',
    evidence: 'RLS, input validation, XSS prevention in place',
    gapDescription: 'No formal OWASP audit report',
    remediationPlan: 'Conduct OWASP security audit, document mitigations',
    priority: 'critical',
    estimatedEffort: '5-7 days',
    owner: 'Security'
  },
  {
    id: 'nfr-6',
    category: 'nfr',
    subcategory: 'Security & Compliance',
    requirement: 'Pen-test report signed off',
    status: 'gap',
    gapDescription: 'No penetration test conducted',
    remediationPlan: 'Engage security firm for pen test',
    priority: 'critical',
    estimatedEffort: '10-15 days',
    owner: 'Security'
  },

  // 5️⃣ OPERATIONS & SUPPORT
  {
    id: 'ops-1',
    category: 'operations',
    subcategory: 'Runbook & SOPs',
    requirement: 'Startup & shutdown procedures',
    status: 'partial',
    evidence: 'Deployment guide exists',
    gapDescription: 'No formal runbook with checklists',
    remediationPlan: 'Create operational runbook with step-by-step procedures',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'DevOps'
  },
  {
    id: 'ops-2',
    category: 'operations',
    subcategory: 'Runbook & SOPs',
    requirement: 'Incident response playbooks',
    status: 'gap',
    gapDescription: 'No incident response documentation',
    remediationPlan: 'Create playbooks for common incidents (DB down, auth issues)',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'DevOps'
  },
  {
    id: 'ops-3',
    category: 'operations',
    subcategory: 'Monitoring & Observability',
    requirement: 'Logs centralized',
    status: 'partial',
    evidence: 'Edge function logs available',
    gapDescription: 'No centralized logging dashboard',
    remediationPlan: 'Set up log aggregation (ELK/Loki)',
    priority: 'high',
    estimatedEffort: '5-7 days',
    owner: 'DevOps'
  },
  {
    id: 'ops-4',
    category: 'operations',
    subcategory: 'Monitoring & Observability',
    requirement: 'Alerts mapped to severity',
    status: 'gap',
    gapDescription: 'No alerting system configured',
    remediationPlan: 'Define alert thresholds, set up PagerDuty/Slack integration',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'DevOps'
  },

  // 6️⃣ TESTING & VALIDATION
  {
    id: 'test-1',
    category: 'testing',
    subcategory: 'Test Coverage',
    requirement: 'Unit test coverage threshold met',
    status: 'partial',
    evidence: 'Vitest configured, test files exist',
    gapDescription: 'No coverage report or threshold enforcement',
    remediationPlan: 'Add coverage reporting to CI, set 80% threshold',
    priority: 'high',
    estimatedEffort: '2-3 days',
    owner: 'QA'
  },
  {
    id: 'test-2',
    category: 'testing',
    subcategory: 'Test Coverage',
    requirement: 'Integration tests complete',
    status: 'partial',
    evidence: 'Service tests exist (e.g., boardService.test.ts)',
    gapDescription: 'Incomplete coverage of all services',
    remediationPlan: 'Complete integration tests for all services',
    priority: 'high',
    estimatedEffort: '5-7 days',
    owner: 'QA'
  },
  {
    id: 'test-3',
    category: 'testing',
    subcategory: 'Acceptance',
    requirement: 'UAT signed off by business',
    status: 'gap',
    gapDescription: 'No formal UAT process',
    remediationPlan: 'Define UAT scenarios, conduct sign-off sessions',
    priority: 'high',
    estimatedEffort: '3-5 days',
    owner: 'Product'
  },
  {
    id: 'test-4',
    category: 'testing',
    subcategory: 'Automation',
    requirement: 'Regression suite automated',
    status: 'partial',
    evidence: 'Vitest with test files',
    gapDescription: 'No E2E regression tests',
    remediationPlan: 'Add Playwright E2E tests for critical paths',
    priority: 'high',
    estimatedEffort: '5-7 days',
    owner: 'QA'
  },

  // 7️⃣ KNOWLEDGE TRANSFER & OWNERSHIP
  {
    id: 'kt-1',
    category: 'knowledge-transfer',
    subcategory: 'KT Completeness',
    requirement: 'Functional KT completed',
    status: 'complete',
    evidence: 'Documentation portal with module documentation',
    priority: 'high'
  },
  {
    id: 'kt-2',
    category: 'knowledge-transfer',
    subcategory: 'KT Completeness',
    requirement: 'Technical KT completed',
    status: 'complete',
    evidence: 'Tech stack, architecture diagrams documented',
    priority: 'high'
  },
  {
    id: 'kt-3',
    category: 'knowledge-transfer',
    subcategory: 'KT Completeness',
    requirement: 'Architecture walkthrough done',
    status: 'complete',
    evidence: 'System architecture diagram with explanations',
    priority: 'high'
  },
  {
    id: 'kt-4',
    category: 'knowledge-transfer',
    subcategory: 'Documentation Assets',
    requirement: 'Functional specification',
    status: 'complete',
    evidence: 'moduleDocumentation.ts with 23 modules',
    priority: 'high'
  },
  {
    id: 'kt-5',
    category: 'knowledge-transfer',
    subcategory: 'Documentation Assets',
    requirement: 'Operations manual',
    status: 'partial',
    evidence: 'Deployment guide exists',
    gapDescription: 'No dedicated operations manual',
    remediationPlan: 'Create comprehensive ops manual with maintenance tasks',
    priority: 'medium',
    estimatedEffort: '3-5 days',
    owner: 'DevOps'
  },
  {
    id: 'kt-6',
    category: 'knowledge-transfer',
    subcategory: 'Documentation Assets',
    requirement: 'Troubleshooting guide',
    status: 'complete',
    evidence: 'Troubleshooting section in deployment guide',
    priority: 'high'
  },

  // 8️⃣ GOVERNANCE & SIGN-OFF
  {
    id: 'gov-1',
    category: 'governance',
    subcategory: 'Sign-off',
    requirement: 'Product owner sign-off',
    status: 'gap',
    gapDescription: 'No formal sign-off tracking',
    remediationPlan: 'Create sign-off workflow in system',
    priority: 'high',
    estimatedEffort: '2-3 days',
    owner: 'Product'
  },
  {
    id: 'gov-2',
    category: 'governance',
    subcategory: 'Sign-off',
    requirement: 'Architecture board approval',
    status: 'gap',
    gapDescription: 'No architecture approval process',
    remediationPlan: 'Conduct architecture review board session',
    priority: 'medium',
    estimatedEffort: '2 days',
    owner: 'Technical Lead'
  },
  {
    id: 'gov-3',
    category: 'governance',
    subcategory: 'Sign-off',
    requirement: 'Security approval',
    status: 'gap',
    gapDescription: 'No security sign-off process',
    remediationPlan: 'Conduct security review, obtain sign-off',
    priority: 'critical',
    estimatedEffort: '3-5 days',
    owner: 'Security'
  },
  {
    id: 'gov-4',
    category: 'governance',
    subcategory: 'Sign-off',
    requirement: 'Operations acceptance',
    status: 'gap',
    gapDescription: 'No operations acceptance process',
    remediationPlan: 'Define ops acceptance criteria, conduct handover',
    priority: 'high',
    estimatedEffort: '2-3 days',
    owner: 'DevOps'
  },
  {
    id: 'gov-5',
    category: 'governance',
    subcategory: 'Sign-off',
    requirement: 'Final Go-Live certificate',
    status: 'gap',
    gapDescription: 'No go-live certification process',
    remediationPlan: 'Create go-live checklist, obtain all sign-offs',
    priority: 'critical',
    estimatedEffort: '1-2 days',
    owner: 'Project Manager'
  }
];

export const dossierCategoryInfo: Record<DossierCategory, { title: string; description: string }> = {
  'functional': {
    title: 'Functional Dossier',
    description: 'Business & Product requirements covering scope, user personas, modules, workflows, and reporting.'
  },
  'architecture': {
    title: 'Architecture Dossier',
    description: 'System, component, integration, data, and security architecture documentation.'
  },
  'technical': {
    title: 'Technical Dossier',
    description: 'Codebase quality, backend/frontend engineering, database, and DevOps standards.'
  },
  'nfr': {
    title: 'Non-Functional Requirements',
    description: 'Performance, scalability, availability, security, and compliance requirements.'
  },
  'operations': {
    title: 'Operations & Support',
    description: 'Runbooks, SOPs, monitoring, observability, and administration procedures.'
  },
  'testing': {
    title: 'Testing & Validation',
    description: 'Unit, integration, UAT, and regression testing coverage and automation.'
  },
  'knowledge-transfer': {
    title: 'Knowledge Transfer & Ownership',
    description: 'KT completeness and documentation assets for handover.'
  },
  'governance': {
    title: 'Governance & Sign-off',
    description: 'Formal approvals from product, architecture, security, and operations stakeholders.'
  }
};
