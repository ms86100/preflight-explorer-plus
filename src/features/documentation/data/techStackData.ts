import { TechStackItem } from '../types';

export const techStackData: TechStackItem[] = [
  // Frontend
  {
    category: 'Frontend Framework',
    name: 'React',
    version: '18.3.1',
    description: 'A JavaScript library for building user interfaces with component-based architecture.',
    purpose: 'Core UI framework providing component lifecycle, hooks, and virtual DOM rendering.'
  },
  {
    category: 'Frontend Framework',
    name: 'TypeScript',
    version: '5.x',
    description: 'Typed superset of JavaScript that compiles to plain JavaScript.',
    purpose: 'Provides type safety, better IDE support, and catches errors at compile time.'
  },
  {
    category: 'Build Tool',
    name: 'Vite',
    version: '5.x',
    description: 'Next generation frontend tooling with fast HMR and optimized builds.',
    purpose: 'Development server with instant hot module replacement and optimized production builds.'
  },
  {
    category: 'Styling',
    name: 'Tailwind CSS',
    version: '3.x',
    description: 'Utility-first CSS framework for rapid UI development.',
    purpose: 'Provides atomic CSS classes for consistent, responsive styling without custom CSS.'
  },
  {
    category: 'Styling',
    name: 'shadcn/ui',
    description: 'Re-usable components built with Radix UI and Tailwind CSS.',
    purpose: 'Pre-built accessible UI components that can be customized and themed.'
  },
  {
    category: 'State Management',
    name: 'TanStack Query',
    version: '5.x',
    description: 'Powerful data synchronization for React applications.',
    purpose: 'Server state management with caching, background updates, and optimistic mutations.'
  },
  {
    category: 'Routing',
    name: 'React Router',
    version: '6.x',
    description: 'Declarative routing for React applications.',
    purpose: 'Client-side routing with protected routes, nested layouts, and URL parameters.'
  },
  {
    category: 'Forms',
    name: 'React Hook Form',
    version: '7.x',
    description: 'Performant, flexible and extensible forms with easy-to-use validation.',
    purpose: 'Form state management with validation, error handling, and submission control.'
  },
  {
    category: 'Validation',
    name: 'Zod',
    version: '3.x',
    description: 'TypeScript-first schema validation with static type inference.',
    purpose: 'Runtime validation of data with full TypeScript integration.'
  },
  {
    category: 'Charts',
    name: 'Recharts',
    version: '2.x',
    description: 'Composable charting library built on React components.',
    purpose: 'Data visualization for reports, analytics, and dashboards.'
  },
  
  // Backend
  {
    category: 'Backend Platform',
    name: 'Supabase',
    version: 'Self-hosted',
    description: 'Open source Firebase alternative with PostgreSQL database.',
    purpose: 'Provides database, authentication, storage, and serverless functions.'
  },
  {
    category: 'Database',
    name: 'PostgreSQL',
    version: '14+',
    description: 'Advanced open source relational database.',
    purpose: 'Primary data store with support for JSON, full-text search, and complex queries.'
  },
  {
    category: 'Authentication',
    name: 'Supabase Auth',
    description: 'Built-in authentication with multiple providers.',
    purpose: 'User registration, login, password reset, and session management.'
  },
  {
    category: 'Serverless',
    name: 'Edge Functions',
    description: 'Deno-based serverless functions running at the edge.',
    purpose: 'Backend logic, API integrations, webhooks, and scheduled tasks.'
  },
  {
    category: 'Storage',
    name: 'Supabase Storage',
    description: 'S3-compatible object storage with policies.',
    purpose: 'File uploads for attachments, avatars, and document exports.'
  },
  {
    category: 'Realtime',
    name: 'Supabase Realtime',
    description: 'WebSocket-based realtime subscriptions.',
    purpose: 'Live updates for boards, notifications, and collaborative editing.'
  },
  
  // Security
  {
    category: 'Security',
    name: 'Row Level Security (RLS)',
    description: 'PostgreSQL policies for fine-grained access control.',
    purpose: 'Ensures users can only access data they are authorized to see.'
  },
  {
    category: 'Security',
    name: 'JWT Tokens',
    description: 'JSON Web Tokens for stateless authentication.',
    purpose: 'Secure, tamper-proof authentication tokens for API requests.'
  },
  
  // Testing
  {
    category: 'Testing',
    name: 'Vitest',
    version: '4.x',
    description: 'Vite-native testing framework with Jest compatibility.',
    purpose: 'Unit and integration testing for components and services.'
  },
  {
    category: 'Testing',
    name: 'Testing Library',
    version: '16.x',
    description: 'Testing utilities that encourage good testing practices.',
    purpose: 'Component testing with user-centric queries and assertions.'
  },
  
  // DevOps
  {
    category: 'DevOps',
    name: 'Docker',
    description: 'Container platform for consistent deployments.',
    purpose: 'Self-hosted deployment with isolated, reproducible environments.'
  },
  {
    category: 'DevOps',
    name: 'GitHub Actions',
    description: 'CI/CD platform integrated with GitHub.',
    purpose: 'Automated testing, building, and deployment workflows.'
  }
];

export const securityFeatures = [
  {
    feature: 'Row Level Security',
    description: 'Every table has RLS policies ensuring users only access authorized data.',
    implementation: 'PostgreSQL policies using auth.uid() for user context.'
  },
  {
    feature: 'Input Validation',
    description: 'All user inputs are validated on both client and server.',
    implementation: 'Zod schemas for type-safe validation with error messages.'
  },
  {
    feature: 'Authentication',
    description: 'Secure user authentication with session management.',
    implementation: 'Supabase Auth with JWT tokens and refresh token rotation.'
  },
  {
    feature: 'HTTPS Only',
    description: 'All communications encrypted in transit.',
    implementation: 'TLS certificates with HSTS headers.'
  },
  {
    feature: 'Rate Limiting',
    description: 'Protection against brute force and DoS attacks.',
    implementation: 'Edge function rate limiting with sliding window algorithm.'
  },
  {
    feature: 'Audit Logging',
    description: 'Complete trail of user actions for compliance.',
    implementation: 'Database triggers capturing changes with user context.'
  },
  {
    feature: 'Data Classification',
    description: 'Sensitivity labeling for compliance requirements.',
    implementation: 'Classification levels on issues and attachments with export controls.'
  }
];

export const architecturePatterns = [
  {
    pattern: 'Feature-Based Modules',
    description: 'Code organized by business feature, not technical layer.',
    benefits: ['Clear ownership', 'Reduced coupling', 'Easier navigation', 'Independent testing']
  },
  {
    pattern: 'Custom Hooks',
    description: 'Reusable logic extracted into composable hooks.',
    benefits: ['Code reuse', 'Separation of concerns', 'Easier testing', 'Cleaner components']
  },
  {
    pattern: 'Service Layer',
    description: 'API calls abstracted into service modules.',
    benefits: ['Centralized API logic', 'Consistent error handling', 'Mockable for tests']
  },
  {
    pattern: 'Optimistic Updates',
    description: 'UI updates immediately before server confirmation.',
    benefits: ['Instant feedback', 'Better UX', 'Automatic rollback on failure']
  },
  {
    pattern: 'Protected Routes',
    description: 'Authentication guards on sensitive routes.',
    benefits: ['Security enforcement', 'Clean redirect handling', 'Role-based access']
  }
];
