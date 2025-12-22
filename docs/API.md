# Vertex Work Platform - API Documentation

## Overview

This document describes the API endpoints available in the Vertex Work Platform, including REST APIs via Supabase PostgREST and Edge Functions.

## Table of Contents

1. [Authentication](#authentication)
2. [Database API (PostgREST)](#database-api-postgrest)
3. [Edge Functions](#edge-functions)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)

---

## Authentication

### Overview

All API requests require authentication via JWT tokens obtained from Supabase Auth.

### Obtaining a Token

```typescript
import { supabase } from '@/integrations/supabase/client';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Token is automatically included in subsequent requests
const { data: issues } = await supabase.from('issues').select('*');
```

### Token Format

```
Authorization: Bearer <jwt_token>
```

### Token Expiration

- **Access Token**: 1 hour
- **Refresh Token**: 7 days
- Tokens are automatically refreshed by the Supabase client

---

## Database API (PostgREST)

The Supabase client provides type-safe access to all database tables. Row-Level Security (RLS) policies enforce access control.

### Issues

#### List Issues

```typescript
const { data, error } = await supabase
  .from('issues')
  .select(`
    *,
    issue_type:issue_types(*),
    status:issue_statuses(*),
    priority:priorities(*),
    assignee:profiles!issues_assignee_id_fkey(*),
    reporter:profiles!issues_reporter_id_fkey(*)
  `)
  .eq('project_id', projectId)
  .order('created_at', { ascending: false });
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "issue_key": "PROJ-123",
      "summary": "Issue title",
      "description": "Issue description",
      "status": { "id": "uuid", "name": "Active" },
      "priority": { "id": "uuid", "name": "High" },
      "issue_type": { "id": "uuid", "name": "Task" },
      "assignee": { "id": "uuid", "display_name": "John Doe" },
      "reporter": { "id": "uuid", "display_name": "Jane Smith" },
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "error": null
}
```

#### Create Issue

```typescript
const { data, error } = await supabase
  .from('issues')
  .insert({
    project_id: projectId,
    issue_key: 'PROJ-124',
    issue_number: 124,
    summary: 'New issue',
    description: 'Description here',
    issue_type_id: issueTypeId,
    status_id: statusId,
    reporter_id: userId,
    priority_id: priorityId
  })
  .select()
  .single();
```

#### Update Issue

```typescript
const { data, error } = await supabase
  .from('issues')
  .update({
    summary: 'Updated title',
    status_id: newStatusId
  })
  .eq('id', issueId)
  .select()
  .single();
```

#### Delete Issue

```typescript
const { error } = await supabase
  .from('issues')
  .delete()
  .eq('id', issueId);
```

### Projects

#### List Projects

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .order('name');
```

#### Create Project

```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    name: 'New Project',
    project_key: 'NP',
    description: 'Project description',
    lead_id: userId
  })
  .select()
  .single();
```

### Comments

#### List Comments for Issue

```typescript
const { data, error } = await supabase
  .from('comments')
  .select(`
    *,
    author:profiles(*)
  `)
  .eq('issue_id', issueId)
  .order('created_at', { ascending: true });
```

#### Add Comment

```typescript
const { data, error } = await supabase
  .from('comments')
  .insert({
    issue_id: issueId,
    author_id: userId,
    body: 'Comment text with @mentions'
  })
  .select()
  .single();
```

### Attachments

#### Upload Attachment

```typescript
// 1. Upload file to storage
const { data: uploadData, error: uploadError } = await supabase
  .storage
  .from('attachments')
  .upload(`${issueId}/${fileName}`, file);

// 2. Create attachment record
const { data, error } = await supabase
  .from('attachments')
  .insert({
    issue_id: issueId,
    author_id: userId,
    filename: fileName,
    file_path: uploadData.path,
    file_size: file.size,
    mime_type: file.type
  })
  .select()
  .single();
```

---

## Edge Functions

Edge Functions provide server-side logic for operations that can't be performed client-side.

### Git API

**Endpoint:** `/functions/v1/git-api`

#### Discover Repositories

```typescript
const { data, error } = await supabase.functions.invoke('git-api', {
  body: {
    action: 'discover-repos',
    organizationId: 'uuid'
  }
});
```

**Response:**
```json
{
  "repositories": [
    {
      "remote_id": "12345",
      "name": "my-repo",
      "slug": "org/my-repo",
      "clone_url": "https://github.com/org/my-repo.git",
      "web_url": "https://github.com/org/my-repo",
      "default_branch": "main"
    }
  ]
}
```

#### Create Branch

```typescript
const { data, error } = await supabase.functions.invoke('git-api', {
  body: {
    action: 'create-branch',
    repositoryId: 'uuid',
    branchName: 'feature/PROJ-123',
    sourceBranch: 'main',
    issueId: 'uuid'
  }
});
```

#### Create Pull Request

```typescript
const { data, error } = await supabase.functions.invoke('git-api', {
  body: {
    action: 'create-pr',
    repositoryId: 'uuid',
    title: 'PROJ-123: Feature implementation',
    description: 'PR description',
    sourceBranch: 'feature/PROJ-123',
    targetBranch: 'main'
  }
});
```

### Git Webhook

**Endpoint:** `/functions/v1/git-webhook`

Handles incoming webhooks from Git providers (GitHub, GitLab, Bitbucket).

**Supported Events:**
- `push` - Commit events
- `pull_request` - PR events
- `deployment` - Deployment events

### CSV Import

**Endpoint:** `/functions/v1/csv-import`

#### Import Issues

```typescript
const { data, error } = await supabase.functions.invoke('csv-import', {
  body: {
    jobId: 'uuid',
    data: [
      {
        summary: 'Issue 1',
        description: 'Description',
        type: 'Task',
        priority: 'High'
      }
    ],
    mappings: {
      summary: 'summary',
      description: 'description',
      issue_type: 'type',
      priority: 'priority'
    }
  }
});
```

### LDAP Sync

**Endpoint:** `/functions/v1/ldap-sync`

#### Trigger Sync

```typescript
const { data, error } = await supabase.functions.invoke('ldap-sync', {
  body: {
    configId: 'uuid',
    syncType: 'full' // or 'incremental'
  }
});
```

### Rate Limiting

**Endpoint:** `/functions/v1/rate-limit`

#### Check Rate Limit

```typescript
const { data, error } = await supabase.functions.invoke('rate-limit', {
  body: {
    action: 'check',
    key: 'user:uuid:action',
    limit: 100,
    window: 3600 // seconds
  }
});
```

**Response:**
```json
{
  "allowed": true,
  "remaining": 95,
  "reset_at": "2025-01-01T01:00:00Z"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Supabase Error Handling

```typescript
const { data, error } = await supabase.from('issues').select('*');

if (error) {
  switch (error.code) {
    case 'PGRST116':
      console.error('No rows found');
      break;
    case '42501':
      console.error('RLS policy violation');
      break;
    default:
      console.error('Database error:', error.message);
  }
}
```

### Edge Function Error Handling

```typescript
const { data, error } = await supabase.functions.invoke('git-api', {
  body: { action: 'discover-repos' }
});

if (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting
  } else if (error.message.includes('unauthorized')) {
    // Handle auth error
  } else {
    // Handle generic error
  }
}
```

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| Database queries | 1000/hour | Per user |
| Edge Functions | 100/minute | Per user |
| File uploads | 50/hour | Per user |
| Authentication | 10/minute | Per IP |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

### Handling Rate Limits

```typescript
const { data, error } = await supabase.functions.invoke('git-api', {
  body: { action: 'discover-repos' }
});

if (error?.message.includes('rate limit')) {
  // Wait and retry
  const retryAfter = parseInt(error.details?.retry_after || '60');
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  // Retry request
}
```

---

## Pagination

### Offset Pagination

```typescript
const pageSize = 20;
const page = 1;

const { data, error, count } = await supabase
  .from('issues')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1);

// count contains total number of rows
```

### Cursor Pagination

```typescript
const { data, error } = await supabase
  .from('issues')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(20)
  .gt('created_at', lastCreatedAt); // Cursor
```

---

## Filtering

### Basic Filters

```typescript
const { data } = await supabase
  .from('issues')
  .select('*')
  .eq('status_id', statusId)           // Equals
  .neq('assignee_id', null)            // Not equals
  .gt('story_points', 5)               // Greater than
  .gte('created_at', '2025-01-01')     // Greater than or equal
  .lt('priority_id', highPriorityId)   // Less than
  .in('status_id', [id1, id2, id3])    // In array
  .is('resolved_at', null)             // Is null
  .ilike('summary', '%search%');       // Case-insensitive like
```

### Complex Filters

```typescript
const { data } = await supabase
  .from('issues')
  .select('*')
  .or('assignee_id.eq.' + userId + ',reporter_id.eq.' + userId);
```

---

## Real-time Subscriptions

### Subscribe to Changes

```typescript
const channel = supabase
  .channel('issues-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'issues',
      filter: 'project_id=eq.' + projectId
    },
    (payload) => {
      console.log('Change received:', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Event Types

- `INSERT` - New row created
- `UPDATE` - Row updated
- `DELETE` - Row deleted
- `*` - All events

---

## Best Practices

### 1. Always Use Select Specific Columns

```typescript
// Good - specific columns
const { data } = await supabase
  .from('issues')
  .select('id, summary, status_id');

// Bad - all columns
const { data } = await supabase
  .from('issues')
  .select('*');
```

### 2. Use Transactions When Needed

```typescript
// Use RPC for transactions
const { data, error } = await supabase.rpc('create_issue_with_history', {
  p_summary: 'New issue',
  p_project_id: projectId
});
```

### 3. Handle Errors Gracefully

```typescript
try {
  const { data, error } = await supabase.from('issues').select('*');
  if (error) throw error;
  return data;
} catch (err) {
  console.error('Failed to fetch issues:', err);
  toast.error('Failed to load issues');
  return [];
}
```

### 4. Use Type-Safe Queries

```typescript
import { Database } from '@/integrations/supabase/types';

type Issue = Database['public']['Tables']['issues']['Row'];

const { data } = await supabase
  .from('issues')
  .select('*')
  .returns<Issue[]>();
```

---

*Last Updated: 2025-12-22*
*Version: 1.0*
