# Vertex Work Platform - Architecture Documentation

## Overview

The Vertex Work Platform is an enterprise-grade work management system built with modern web technologies. This document describes the system architecture, design decisions, and technical implementation details.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Integration Architecture](#integration-architecture)
7. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    React Application                         ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐││
│  │  │ Pages   │ │Features │ │Components│ │    Hooks/Services  │││
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────────┬──────────┘││
│  │       └───────────┴──────────┴──────────────────┘           ││
│  └──────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┼───────────────────────────────────┐
│                        Backend Layer (Supabase)                  │
│  ┌──────────────────────────┼──────────────────────────────────┐│
│  │                    Edge Functions                            ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐││
│  │  │Git API  │ │CSV Import│ │LDAP Sync│ │  Rate Limiting     │││
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────────┬──────────┘││
│  │       └───────────┴──────────┴──────────────────┘           ││
│  └──────────────────────────┬──────────────────────────────────┘│
│  ┌──────────────────────────┼──────────────────────────────────┐│
│  │                     Core Services                            ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐││
│  │  │  Auth   │ │Database │ │ Storage │ │     Realtime        │││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────────┘││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                    External Integrations                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────────┐│
│  │ GitHub  │ │ GitLab  │ │Bitbucket│ │     LDAP/AD            ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Feature-Based Architecture**: Code organized by feature, not layer
2. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
3. **Single Source of Truth**: Database as authoritative data source
4. **Security by Default**: RLS and authentication built into every layer
5. **Offline-First Consideration**: Designed for self-hosted environments

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18.x |
| TypeScript | Type Safety | 5.x |
| Vite | Build Tool | 5.x |
| Tailwind CSS | Styling | 3.x |
| Tanstack Query | Data Fetching | 5.x |
| React Router | Routing | 6.x |
| React Hook Form | Form Management | 7.x |
| Zod | Schema Validation | 3.x |
| Recharts | Charts/Graphs | 2.x |
| Lucide React | Icons | Latest |

### Backend (Supabase)

| Component | Purpose |
|-----------|---------|
| PostgreSQL | Primary Database |
| GoTrue | Authentication |
| PostgREST | RESTful API |
| Realtime | WebSocket subscriptions |
| Storage | File storage |
| Edge Functions | Serverless functions (Deno) |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| SonarQube | Static analysis |

---

## Application Structure

### Directory Layout

```
src/
├── components/           # Shared UI components
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout components
├── features/            # Feature modules
│   ├── issues/          # Issue management
│   ├── boards/          # Kanban/Scrum boards
│   ├── projects/        # Project management
│   ├── workflows/       # Workflow engine
│   ├── git-integration/ # Git provider integration
│   ├── reports/         # Analytics & reporting
│   └── ...              # Other features
├── hooks/               # Shared custom hooks
├── lib/                 # Utility functions
├── pages/               # Route components
├── integrations/        # External service clients
│   └── supabase/        # Supabase client & types
└── types/               # Shared type definitions

supabase/
├── functions/           # Edge functions
│   ├── git-api/
│   ├── csv-import/
│   ├── ldap-sync/
│   └── ...
├── migrations/          # Database migrations
└── config.toml          # Supabase configuration
```

### Feature Module Structure

Each feature follows a consistent structure:

```
features/{feature-name}/
├── components/          # React components
│   ├── FeatureMain.tsx
│   └── FeaturePart.tsx
├── hooks/               # Feature-specific hooks
│   └── useFeature.ts
├── services/            # API/business logic
│   └── featureService.ts
├── types/               # Type definitions
│   └── index.ts
└── index.ts             # Public exports
```

### Component Patterns

#### Container/Presenter Pattern

```typescript
// Container (smart component)
function IssueListContainer() {
  const { data, isLoading } = useIssues();
  return <IssueList issues={data} loading={isLoading} />;
}

// Presenter (dumb component)
function IssueList({ issues, loading }: IssueListProps) {
  if (loading) return <Skeleton />;
  return <ul>{issues.map(issue => <IssueItem key={issue.id} {...issue} />)}</ul>;
}
```

#### Custom Hook Pattern

```typescript
function useIssues(projectId: string) {
  return useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => issueService.getIssues(projectId),
  });
}
```

---

## Data Flow

### Read Operations

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Component  │───▶│  useQuery   │───▶│   Service   │───▶│  Supabase   │
│             │◀───│   (cache)   │◀───│             │◀───│  (RLS)      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

1. Component renders and calls custom hook
2. Tanstack Query checks cache
3. If stale/missing, service function called
4. Supabase client executes query with RLS
5. Data flows back through layers

### Write Operations

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Form     │───▶│ useMutation │───▶│   Service   │───▶│  Supabase   │
│  (Zod)      │    │             │    │(validation) │    │  (RLS)      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Toast     │
                   │  (feedback) │
                   └─────────────┘
```

1. Form validates input with Zod
2. Mutation triggered via Tanstack Query
3. Service performs business logic validation
4. Supabase executes with RLS check
5. Toast provides user feedback

### Real-time Updates

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Supabase   │───▶│  Realtime   │───▶│  Component  │
│  (trigger)  │    │  (channel)  │    │  (update)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

1. Database change triggers Realtime event
2. Client subscribed to channel receives update
3. Component state/cache invalidated
4. UI updates automatically

---

## Security Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───▶│  Supabase   │───▶│    JWT      │
│   Form      │    │    Auth     │    │   Token     │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
┌─────────────────────────────────────────────┘
│
▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    API      │───▶│    RLS      │
│  (storage)  │    │  (header)   │    │  (policy)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Authorization Layers

1. **Authentication**: JWT validation via Supabase Auth
2. **Row-Level Security**: Database policies per table
3. **Role Checks**: `user_roles` table with `has_role()` function
4. **UI Guards**: Route protection and conditional rendering

### RLS Policy Pattern

```sql
-- Standard user access pattern
CREATE POLICY "Users access own data"
ON public.issues
FOR ALL
USING (
  reporter_id = auth.uid() OR
  assignee_id = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);
```

---

## Integration Architecture

### Git Integration

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  UI Panel   │───▶│ Edge Func   │───▶│ Git Provider│
│             │◀───│ (git-api)   │◀───│   API       │
└─────────────┘    └─────────────┘    └─────────────┘
        │                                    │
        ▼                                    ▼
┌─────────────┐                      ┌─────────────┐
│  Database   │◀─────────────────────│  Webhook    │
│  (sync)     │                      │  Handler    │
└─────────────┘                      └─────────────┘
```

### Webhook Processing

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Git Provider│───▶│git-webhook  │───▶│  Database   │
│  (event)    │    │(validate)   │    │  (update)   │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │Smart Commit │
                   │  Parser     │
                   └─────────────┘
```

---

## Deployment Architecture

### Self-Hosted (Recommended)

```
┌─────────────────────────────────────────────────────┐
│                   Host Machine                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐│
│  │   Docker    │ │   Docker    │ │     Docker      ││
│  │  (Vite)     │ │ (Supabase)  │ │   (Postgres)    ││
│  └──────┬──────┘ └──────┬──────┘ └────────┬────────┘│
│         └───────────────┴─────────────────┘         │
│                         │                           │
│                  ┌──────┴──────┐                    │
│                  │   Nginx     │                    │
│                  │  (reverse)  │                    │
│                  └──────┬──────┘                    │
└─────────────────────────┼───────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │  Clients  │
                    └───────────┘
```

### Environment Configuration

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| Development | Local development | Supabase local |
| Staging | Pre-production testing | Isolated instance |
| Production | Live system | Full redundancy |

---

## Performance Considerations

### Frontend Optimization

- **Code Splitting**: Route-based lazy loading
- **Query Caching**: Tanstack Query with stale-while-revalidate
- **Memoization**: React.memo for expensive components
- **Virtual Lists**: For large data sets

### Backend Optimization

- **Database Indexes**: On frequently queried columns
- **RLS Policies**: Optimized for common access patterns
- **Edge Functions**: Cold start minimization
- **Connection Pooling**: Via Supabase

### Caching Strategy

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Browser    │───▶│   React     │───▶│  Supabase   │
│  (session)  │    │   Query     │    │  (CDN)      │
└─────────────┘    └─────────────┘    └─────────────┘
     5min              5min              1hour
```

---

## Monitoring & Observability

### Logging Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | Console/Sentry | Error tracking |
| Edge Functions | Supabase Logs | Request/error logs |
| Database | Audit Tables | Change tracking |

### Key Metrics

- **Response Time**: API p50, p95, p99
- **Error Rate**: 4xx, 5xx responses
- **Active Users**: Daily/monthly active
- **Database Performance**: Query times, connections

---

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention |
|------|-----------|-----------|
| Database | Daily | 30 days |
| File Storage | Daily | 30 days |
| Audit Logs | Daily | 90 days |

### Recovery Procedures

1. **Point-in-Time Recovery**: Restore to specific timestamp
2. **Full Restore**: Complete system recovery
3. **Partial Restore**: Specific tables/data

---

## Future Considerations

### Scalability Path

1. **Read Replicas**: For reporting/analytics
2. **Microservices**: Extracting high-load features
3. **CDN**: Static asset delivery
4. **Queue System**: For async processing

### Technology Roadmap

- Mobile applications (React Native)
- Advanced analytics (time-series DB)
- AI/ML integration (issue suggestions)
- Advanced workflow automation

---

*Last Updated: 2025-12-22*
*Version: 1.0*
