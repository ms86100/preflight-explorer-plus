# Jira Data Center Complete Technical Study

## Database Architecture, UI/UX Patterns & Feature Analysis

---

## Table of Contents

### Part 1: Features & UI/UX Analysis
1. [Feature Overview](#feature-overview)
2. [UI Screens & Layouts](#ui-screens--layouts)
3. [Core UI Components](#core-ui-components)
4. [Interaction Patterns](#interaction-patterns)
5. [Enterprise Features](#enterprise-features)

### Part 2: Plugin Ecosystem
6. [Built-in System Plugins](#built-in-system-plugins)
7. [ScriptRunner (Most Critical)](#scriptrunner-most-critical)
8. [Automation for Jira](#automation-for-jira)
9. [Advanced Roadmaps (Portfolio)](#advanced-roadmaps-portfolio)
10. [eazyBI Reporting](#eazybi-reporting)
11. [Structure & BigPicture](#structure--bigpicture)
12. [DevOps & CI/CD Plugins](#devops--cicd-plugins)
13. [Security & Compliance Plugins](#security--compliance-plugins)
14. [Plugin Architecture](#plugin-architecture)

### Part 3: Database Architecture
15. [Executive Summary](#executive-summary)
16. [Database Statistics](#database-statistics)
17. [Schema Architecture Overview](#schema-architecture-overview)
18. [Core Domain Tables](#core-domain-tables)
19. [Plugin Tables (AO_* Prefix)](#plugin-tables-ao_-prefix)
20. [Entity Relationship Diagrams](#entity-relationship-diagrams)
21. [Index Analysis](#index-analysis)
22. [Foreign Key Relationships](#foreign-key-relationships)
23. [Views, Functions & Stored Procedures](#views-functions--stored-procedures)
24. [Migration Considerations](#migration-considerations)

---

# PART 1: FEATURES & UI/UX ANALYSIS

---

## Feature Overview

Jira Data Center is an enterprise-grade project management and issue tracking platform. Key feature categories:

### 1. Project Management
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Projects | Container for issues, organized by key (e.g., "PROJ") | `project` |
| Components | Sub-divisions within projects | `component` |
| Versions/Releases | Track release cycles | `projectversion` |
| Project Categories | Group related projects | `projectcategory` |
| Project Archival | Archive inactive projects | `project.archived` |

### 2. Issue Tracking
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Issues | Core work items (bugs, stories, tasks) | `jiraissue` |
| Issue Types | Categorize issues (Bug, Story, Epic, Task, Sub-task) | `issuetype` |
| Priorities | Urgency levels (Highest → Lowest) | `priority` |
| Statuses | Workflow states (To Do, In Progress, Done) | `issuestatus` |
| Resolutions | How issues were closed | `resolution` |
| Labels | Freeform tagging | `label` |
| Watchers | Subscribe to issue updates | `userassociation` |
| Voting | Users can vote on issues | `jiraissue.votes` |

### 3. Agile/Scrum/Kanban (Jira Software)
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Boards | Visual workflow (Kanban/Scrum) | `AO_60DB71_RAPIDVIEW` |
| Sprints | Time-boxed iterations | `AO_60DB71_SPRINT` |
| Columns | Workflow stages on board | `AO_60DB71_COLUMN` |
| Swimlanes | Horizontal grouping (by assignee, priority) | `AO_60DB71_SWIMLANE` |
| Quick Filters | JQL-based board filters | `AO_60DB71_QUICKFILTER` |
| Backlog | Prioritized list of work | `AO_60DB71_LEXORANK` |
| Estimation | Story points, time estimates | `AO_60DB71_ESTIMATION_STATISTICS` |
| Velocity Charts | Sprint velocity tracking | Calculated from sprint data |
| Burndown/Burnup | Sprint progress visualization | Calculated from sprint data |

### 4. Workflow Engine
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Workflows | State machine definitions | `jiraworkflows` |
| Workflow Schemes | Map workflows to projects | `workflowscheme`, `workflowschemeentity` |
| Transitions | Move between statuses | Stored in `jiraworkflows.descriptor` (XML) |
| Conditions | Rules for transitions | Embedded in workflow XML |
| Validators | Input validation on transitions | Embedded in workflow XML |
| Post Functions | Actions after transitions | Embedded in workflow XML |
| Screens | Forms shown during transitions | `fieldscreen`, `fieldscreentab`, `fieldscreenlayoutitem` |

### 5. User Management & Authentication
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Users | User accounts | `app_user`, `cwd_user` |
| Groups | User groupings | `cwd_group` |
| Memberships | User-group associations | `cwd_membership` |
| Directories | Identity providers (internal, LDAP, SAML) | `cwd_directory` |
| Personal Access Tokens | API authentication | `AO_81F455_PERSONAL_TOKEN` |
| OAuth2 | Third-party app auth | `AO_FE1BC5_*` tables |
| JIT Provisioning | Auto-create users on first login | Via SAML/OIDC |

### 6. Permissions & Security
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Global Permissions | System-wide access | `globalpermissionentry` |
| Permission Schemes | Project-level access rules | `permissionscheme`, `schemepermissions` |
| Project Roles | Role-based access (Administrators, Developers, Users) | `projectrole`, `projectroleactor` |
| Issue Security | Restrict issue visibility | `issuesecurityscheme`, `schemeissuesecurities` |
| Secure Attachments | Control file access | Linked to issue security |

### 7. Custom Fields
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Field Definitions | Custom data fields | `customfield` |
| Field Values | Stored values per issue | `customfieldvalue` |
| Field Options | Dropdown/select options | `customfieldoption` |
| Field Configurations | Display settings | `fieldconfiguration`, `fieldconfigscheme` |
| Field Contexts | Scope fields to projects/issue types | `fieldconfigschemeissuetype` |

### 8. Time Tracking
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Original Estimate | Initial time estimate | `jiraissue.timeoriginalestimate` |
| Remaining Estimate | Time left | `jiraissue.timeestimate` |
| Time Spent | Logged work | `jiraissue.timespent` |
| Work Logs | Detailed time entries | `worklog` |

### 9. Issue Relationships
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Issue Links | Relationships between issues | `issuelink`, `issuelinktype` |
| Sub-tasks | Parent-child hierarchy | `jiraissue` (self-referencing) |
| Epics | Container for stories | Via custom field or parent link |
| Clone/Duplicate | Copy issues | Creates new `jiraissue` record |

### 10. Attachments & Files
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| File Attachments | Upload files to issues | `fileattachment` |
| Thumbnails | Image previews | `fileattachment.thumbnailable` |

### 11. Search & Filters
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| JQL (Jira Query Language) | Powerful search syntax | Queries against all tables |
| Saved Filters | Reusable searches | `searchrequest` |
| Filter Subscriptions | Email notifications | `filtersubscription` |
| Quick Search | Global search bar | N/A (UI feature) |

### 12. Notifications
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Notification Schemes | Email triggers | `notificationscheme`, `notification` |
| @Mentions | Notify specific users | Parsed from comment text |
| Watchers | Automatic notifications | `userassociation` |

### 13. Automation
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Automation Rules | Trigger-condition-action | `AO_589059_RULE_CONFIG` |
| Rule Components | Building blocks | `AO_589059_RULE_CFG_COMPONENT` |
| Audit Logs | Execution history | `AO_589059_AUDIT_ITEM` |

### 14. Integrations
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Git/DVCS | Link commits, branches, PRs | `AO_E8B6CC_*` tables |
| Webhooks | Push notifications | `AO_4AEACD_WEBHOOK_DAO` |
| REST API | Programmatic access | N/A (API layer) |
| App Marketplace | Third-party plugins | `AO_*` plugin tables |

### 15. Reporting & Dashboards
| Feature | Description | Database Tables |
|---------|-------------|-----------------|
| Dashboards | Configurable home pages | `portalpage` |
| Gadgets | Dashboard widgets | `portletconfiguration` |
| Reports | Built-in analytics | Calculated views |

---

## UI Screens & Layouts

### 1. Project Navigation (Sidebar)
The project-centric view uses a collapsible sidebar:

```
┌─────────────────────────────────────────────────────────┐
│ [Project Logo] PROJECT NAME              [⚙️ Settings]  │
├─────────────────────────────────────────────────────────┤
│ 📊 Summary                                              │
│ 📋 Backlog                                              │
│ 🎯 Active Sprints / Board                               │
│ 📈 Reports                                              │
│ ├── Velocity Chart                                      │
│ ├── Burndown Chart                                      │
│ └── Control Chart                                       │
│ 📦 Releases                                             │
│ ⚡ Issues                                                │
│ 🔧 Components                                           │
│ ───────────────────                                     │
│ 📱 Apps (Plugin Extensions)                             │
│ ⚙️ Project Settings                                     │
└─────────────────────────────────────────────────────────┘
```

### 2. Issue Detail View (Full Page)
Two-column layout when opening issue directly:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [◀ Back] PROJ-123                           [👁 Watch] [⋮ More Actions] │
├─────────────────────────────────────────────────┬───────────────────────┤
│ MAIN CONTENT (70%)                              │ SIDEBAR (30%)         │
│                                                 │                       │
│ ┌─────────────────────────────────────────────┐ │ Status: [🔵 In Prog] │
│ │ [Epic] Parent Epic Name                     │ │ Assignee: [👤 User]  │
│ │                                             │ │ Reporter: [👤 User]  │
│ │ ## Issue Summary Title                      │ │ Labels: [tag1] [tag2]│
│ │ (click to edit inline)                      │ │ Sprint: Sprint 23    │
│ └─────────────────────────────────────────────┘ │ Story Points: 5      │
│                                                 │ Priority: 🔴 High    │
│ ┌─────────────────────────────────────────────┐ │ Components: [API]    │
│ │ Description                                 │ │ Fix Version: v2.0    │
│ │ (Rich text editor with markdown)            │ │ Due Date: Dec 25     │
│ │                                             │ │                       │
│ └─────────────────────────────────────────────┘ │ ─────────────────────│
│                                                 │ Time Tracking         │
│ ┌─────────────────────────────────────────────┐ │ ⏱ 4h logged / 8h est │
│ │ 📎 Attachments (3)                          │ │ [▓▓▓▓░░░░] 50%       │
│ │ [file.pdf] [screenshot.png] [doc.xlsx]      │ │                       │
│ └─────────────────────────────────────────────┘ │ ─────────────────────│
│                                                 │ Development           │
│ ┌─────────────────────────────────────────────┐ │ 🔗 2 commits          │
│ │ 🔗 Linked Issues                            │ │ 🔀 1 pull request     │
│ │ blocks: PROJ-120                            │ │ 🌿 feature/PROJ-123   │
│ │ is blocked by: PROJ-118                     │ │                       │
│ └─────────────────────────────────────────────┘ │                       │
│                                                 │                       │
│ ┌─────────────────────────────────────────────┐ │                       │
│ │ 💬 Activity                                 │ │                       │
│ │ [All] [Comments] [History] [Work log]       │ │                       │
│ │                                             │ │                       │
│ │ 👤 John Doe - 2 hours ago                   │ │                       │
│ │ "Updated the API endpoint..."               │ │                       │
│ │                                             │ │                       │
│ │ 🔄 System - 3 hours ago                     │ │                       │
│ │ Status changed: To Do → In Progress         │ │                       │
│ └─────────────────────────────────────────────┘ │                       │
└─────────────────────────────────────────────────┴───────────────────────┘
```

### 3. Board View (Kanban/Scrum)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Board Name ▼]    [🔍 Search] [Quick Filters: My Issues | Recently Updated]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TO DO (5)           IN PROGRESS (3)      CODE REVIEW (2)      DONE (12)       │
│  ────────────────    ─────────────────    ─────────────────    ──────────────  │
│  ┌──────────────┐    ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │ PROJ-101     │    │ PROJ-98      │     │ PROJ-95      │     │ PROJ-89    │  │
│  │ Fix login    │    │ Add export   │     │ Refactor DB  │     │ Update UI  │  │
│  │ 🔴 [5]  👤JD │    │ 🟡 [3]  👤AB │     │ 🟢 [8]  👤CD │     │ ✓ 👤EF    │  │
│  │ 📎 2   💬 3  │    │ 📎 1   💬 5  │     │ 📎 0   💬 2  │     │            │  │
│  └──────────────┘    └──────────────┘     └──────────────┘     └────────────┘  │
│  ┌──────────────┐    ┌──────────────┐     ┌──────────────┐                      │
│  │ PROJ-102     │    │ PROJ-99      │     │ PROJ-96      │                      │
│  │ Add sorting  │    │ Fix crash    │     │ API tests    │                      │
│  │ 🟡 [2]  👤GH │    │ 🔴 [1]  👤IJ │     │ 🟢 [3]  👤KL │                      │
│  └──────────────┘    └──────────────┘     └──────────────┘                      │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════   │
│  SWIMLANE: Expedite (1)                                                         │
│  ────────────────────────────────────────────────────────────────────────────   │
│  ┌──────────────┐                                                               │
│  │ PROJ-105     │                                                               │
│  │ 🚨 URGENT    │                                                               │
│  │ 🔴 [13] 👤MN │                                                               │
│  └──────────────┘                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4. Backlog View

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [🔍 Filter] [📊 View: List ▼]                      [Create Sprint] [Start]     │
├──────────────────────────────────────┬──────────────────────────────────────────┤
│ EPICS PANEL                          │ BACKLOG                                  │
│                                      │                                          │
│ ┌────────────────────────────────┐   │ ┌──────────────────────────────────────┐│
│ │ 🟣 User Authentication         │   │ │ SPRINT 24 (Dec 15 - Dec 29)          ││
│ │    12 issues | 45 points       │   │ │ 8 issues | 34 points | 2 weeks       ││
│ └────────────────────────────────┘   │ │ ──────────────────────────────────── ││
│ ┌────────────────────────────────┐   │ │ ☐ PROJ-201 Implement SSO      [5] 👤 ││
│ │ 🟢 Payment Integration         │   │ │ ☐ PROJ-202 Add 2FA            [8] 👤 ││
│ │    8 issues | 32 points        │   │ │ ☐ PROJ-203 Fix session bug    [3] 👤 ││
│ └────────────────────────────────┘   │ └──────────────────────────────────────┘│
│ ┌────────────────────────────────┐   │                                          │
│ │ 🔵 Mobile App                  │   │ ┌──────────────────────────────────────┐│
│ │    25 issues | 89 points       │   │ │ SPRINT 25 (Dec 30 - Jan 12)          ││
│ └────────────────────────────────┘   │ │ 5 issues | 21 points                 ││
│                                      │ └──────────────────────────────────────┘│
│ [+ Create Epic]                      │                                          │
│                                      │ ┌──────────────────────────────────────┐│
│ ─────────────────────────────────    │ │ 📋 BACKLOG (47 issues)               ││
│                                      │ │ ──────────────────────────────────── ││
│ VERSIONS                             │ │ ☐ PROJ-250 New feature        [?]    ││
│ ┌────────────────────────────────┐   │ │ ☐ PROJ-251 Bug fix            [2]    ││
│ │ 🏷 v2.0 (Released)             │   │ │ ☐ PROJ-252 Documentation      [1]    ││
│ │ 🏷 v2.1 (In Progress)          │   │ │ ... (drag to sprint to plan)         ││
│ │ 🏷 v3.0 (Planned)              │   │ └──────────────────────────────────────┘│
│ └────────────────────────────────┘   │                                          │
└──────────────────────────────────────┴──────────────────────────────────────────┘
```

### 5. Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Dashboard Name ▼]                              [+ Add Gadget] [⚙️ Edit Layout] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────────────────┐  ┌────────────────────────────────────────┐│
│  │ 📊 Assigned to Me              │  │ 📈 Sprint Burndown                     ││
│  │ ─────────────────────────────  │  │                                        ││
│  │ PROJ-123 Fix login bug    🔴   │  │     ╲                                  ││
│  │ PROJ-124 Add export       🟡   │  │       ╲    Ideal                       ││
│  │ PROJ-125 Update docs      🟢   │  │         ╲  ─────                       ││
│  │ PROJ-126 Review PR        🟢   │  │           ╲       ╲ Actual             ││
│  │                                │  │             ╲       ╲                  ││
│  │ [View all 12 issues →]         │  │ Day 1  2  3  4  5  6  7  8  9  10     ││
│  └────────────────────────────────┘  └────────────────────────────────────────┘│
│                                                                                 │
│  ┌────────────────────────────────┐  ┌────────────────────────────────────────┐│
│  │ 🎯 Filter Results              │  │ 🥧 Issues by Priority                  ││
│  │ ─────────────────────────────  │  │                                        ││
│  │ Filter: "Open Bugs"            │  │      ┌─────┐                           ││
│  │                                │  │   ┌──┤ 23% │ High                      ││
│  │ 47 issues found                │  │   │  └─────┤                           ││
│  │ Created: 12 | Resolved: 8      │  │   │ 45%   │ Medium                     ││
│  │ Avg Age: 4.2 days              │  │   └───────┤                            ││
│  │                                │  │     32%   │ Low                        ││
│  │ [Open Filter →]                │  │           └─────                       ││
│  └────────────────────────────────┘  └────────────────────────────────────────┘│
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ 📋 Activity Stream                                                        │  │
│  │ ──────────────────────────────────────────────────────────────────────── │  │
│  │ 👤 John created PROJ-127 "New feature request"           2 minutes ago   │  │
│  │ 👤 Jane commented on PROJ-123 "Fixed in latest build"   15 minutes ago   │  │
│  │ 🔄 PROJ-124 status changed to "In Review"                1 hour ago      │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core UI Components

Following the **Atlassian Design System (ADS)**:

### 1. Lozenges (Status Indicators)
```
[🔵 IN PROGRESS]  [🟢 DONE]  [⚪ TO DO]  [🟡 IN REVIEW]  [🔴 BLOCKED]
```
- Blue: In Progress
- Green: Done/Resolved
- Gray: To Do/Open
- Yellow: Pending/Review
- Red: Blocked/Critical

### 2. Badges (Numeric Indicators)
```
Comments (5)   Attachments (3)   Subtasks 2/5   Watchers (12)
         ↑                 ↑              ↑              ↑
      [badge]          [badge]        [badge]        [badge]
```

### 3. Avatars
```
[👤] Single user          [👤👤👤+3] Stacked avatars     [🏢] Team/Project
```

### 4. Cards (Issue Cards on Boards)
```
┌──────────────────────────┐
│ 🟣 Epic Label            │  ← Epic indicator
│ PROJ-123                 │  ← Issue key
│ Summary text here...     │  ← Issue summary
│ ─────────────────────    │
│ 🔴 High  [5]  👤 JD      │  ← Priority, Points, Assignee
│ 📎 2  💬 3  ⏱ 4h         │  ← Attachments, Comments, Time
└──────────────────────────┘
```

### 5. Inline Edit Pattern
```
READ MODE:                    EDIT MODE:
┌─────────────────────────┐   ┌─────────────────────────┐
│ Issue summary text    ✏️│ → │ [Issue summary text   ]│
└─────────────────────────┘   │ [✓ Save] [✗ Cancel]    │
                              └─────────────────────────┘
```

### 6. Dropdown Menus
```
┌─────────────────────┐
│ Assignee: [John ▼] │
└─────────────────────┘
         ↓
┌─────────────────────┐
│ 🔍 Search users...  │
├─────────────────────┤
│ 👤 John Doe         │
│ 👤 Jane Smith       │
│ 👤 Bob Wilson       │
│ ─────────────────── │
│ 🚫 Unassigned       │
└─────────────────────┘
```

### 7. Modal Dialogs
```
┌─────────────────────────────────────────────────┐
│ Create Issue                              [✕]  │
├─────────────────────────────────────────────────┤
│ Project*:     [Select Project ▼]               │
│ Issue Type*:  [🐛 Bug ▼]                        │
│ Summary*:     [                              ]  │
│ Description:  [                              ]  │
│               [                              ]  │
│ Assignee:     [Automatic ▼]                    │
│ Priority:     [🟡 Medium ▼]                    │
├─────────────────────────────────────────────────┤
│                        [Cancel] [Create Issue]  │
└─────────────────────────────────────────────────┘
```

---

## Interaction Patterns

### 1. Drag & Drop
- **Board columns**: Drag issues between status columns
- **Backlog**: Drag issues to/from sprints
- **Ranking**: Drag to reorder priority within column
- **Attachments**: Drag files onto issue

### 2. Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| Global Search | `/` |
| Create Issue | `c` |
| Quick Search | `g` then `g` |
| Go to Board | `g` then `b` |
| Assign to Me | `i` |
| Watch Issue | `w` |
| Edit Issue | `e` |
| Add Comment | `m` |

### 3. JQL (Jira Query Language)
```sql
-- Examples:
project = PROJ AND status = "In Progress"
assignee = currentUser() AND resolution = Unresolved
created >= -7d AND priority = High
labels in (urgent, critical) ORDER BY created DESC
sprint in openSprints() AND type = Bug
```

### 4. Quick Filters
Toggle buttons above boards that apply JQL filters:
```
[My Issues] [Only Bugs] [Recently Updated] [Blocked]
    ↓
Applies: assignee = currentUser()
```

### 5. Bulk Operations
```
┌─────────────────────────────────────────────────┐
│ Bulk Change: 15 issues selected                │
├─────────────────────────────────────────────────┤
│ ☐ Change Status                                │
│ ☐ Change Assignee                              │
│ ☐ Change Priority                              │
│ ☐ Add Labels                                   │
│ ☐ Move to Sprint                               │
│ ☐ Change Fix Version                           │
│ ☐ Delete Issues                                │
├─────────────────────────────────────────────────┤
│                              [Next →]           │
└─────────────────────────────────────────────────┘
```

---

## Enterprise Features (Data Center Specific)

### 1. High Availability
- **Clustering**: Multiple app nodes behind load balancer
- **Shared Database**: All nodes use same PostgreSQL
- **Shared File System**: NFS/EFS for attachments
- **Session Affinity**: Sticky sessions for consistency

### 2. Zero-Downtime Upgrades
- Rolling upgrades across cluster nodes
- No user disruption during maintenance

### 3. CDN Support
- Geo-distributed static asset caching
- Improved performance for global teams

### 4. Advanced Auditing
```
┌─────────────────────────────────────────────────────────────────────┐
│ Audit Log                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ TIMESTAMP        │ USER      │ ACTION              │ DETAILS        │
├──────────────────┼───────────┼─────────────────────┼────────────────┤
│ 2024-01-15 14:32 │ admin     │ Permission changed  │ Added user to  │
│                  │           │                     │ Administrators │
│ 2024-01-15 14:30 │ john.doe  │ Issue created       │ PROJ-500       │
│ 2024-01-15 14:28 │ system    │ Workflow activated  │ New workflow   │
└──────────────────┴───────────┴─────────────────────┴────────────────┘
```

### 5. Rate Limiting
- REST API rate limits per user/token
- Protection against abuse
- Configurable thresholds

### 6. Project/Issue Archival
- Move inactive projects to archive
- Maintain queryable history
- Improve active database performance

---

# PART 2: PLUGIN ECOSYSTEM

---

## Built-in System Plugins

These are mandatory core apps installed with Jira Data Center (visible under ⚙️ Manage apps → System):

| Plugin | Function | Database Tables | Enterprise Usage |
|--------|----------|-----------------|------------------|
| **Jira Core** | Issues, projects, workflows | `jiraissue`, `project`, `jiraworkflows` | Base platform |
| **Agile (Boards)** | Scrum & Kanban boards | `AO_60DB71_*` | Sprint & delivery tracking |
| **Issue Navigator** | JQL search & filters | `searchrequest` | Reporting, dashboards |
| **Workflow Engine** | States & transitions | `jiraworkflows`, `workflowscheme` | Business process modeling |
| **Permission Schemes** | Role-based access | `permissionscheme`, `schemepermissions` | SOX / audit compliance |
| **Notification Schemes** | Email triggers | `notificationscheme`, `notification` | SLA & approvals |
| **REST API** | `/rest/api/2` endpoints | N/A | Integrations, automation |

---

## ScriptRunner (Most Critical)

**The #1 most-used plugin in enterprises** - transforms Jira from a tracker into a programmable business platform.

### Capabilities

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Workflow Conditions** | Groovy scripts to control transition visibility | Hide "Close" unless all subtasks done |
| **Workflow Validators** | Validate input before transition completes | Require "Environment" field for Bugs |
| **Post Functions** | Execute actions after transition | Create linked issues, update parent epic |
| **Script Listeners** | Event-driven background triggers | Sync data to external systems on issue create |
| **REST Endpoints** | Custom APIs within Jira | `/rest/scriptrunner/latest/custom/myEndpoint` |
| **Script Fragments** | Modify UI dynamically | Add custom buttons, menus, web panels |
| **Script Console** | Interactive admin sandbox | Bulk updates, diagnostics, data cleanup |

### Technical Implementation (Groovy)

```groovy
// Example: Post Function to update custom field
import com.atlassian.jira.component.ComponentAccessor

def customFieldManager = ComponentAccessor.getCustomFieldManager()
def cf = customFieldManager.getCustomFieldObjectByName("My Custom Field")

// Set custom field value
issue.setCustomFieldValue(cf, "New Value")
```

### Common Enterprise Patterns

1. **Automated Escalation**: Listener detects issue stalled 48+ hours → auto-notify or move to "Blocked"
2. **Complex Validation**: If `Issue Type = Bug`, require `Environment` field with specific format
3. **External Integration**: Post function sends data to ERP/SQL/SAP on "Resolve" transition
4. **Bulk Cleanup**: Console script to close 1000+ stale issues via custom JQL

---

## Automation for Jira

Built-in DC app (since v9.0) for no-code automation rules.

### Rule Components

| Component | Description | Example |
|-----------|-------------|---------|
| **Triggers** | What starts the rule | Issue created, Status changed, Scheduled |
| **Conditions** | Filters when to run | Only if Priority = High |
| **Actions** | What happens | Assign to user, Add comment, Transition issue |

### Database Tables

| Table | Content |
|-------|---------|
| `AO_589059_RULE_CONFIG` | Rule definitions (name, state, author) |
| `AO_589059_RULE_CFG_COMPONENT` | Components (trigger/condition/action) with JSON config |
| `AO_589059_AUDIT_ITEM` | Execution audit log |

### Common Automation Rules

```
┌─────────────────────────────────────────────────────────────────┐
│ WHEN: Issue created                                             │
│ IF: Priority = "Highest"                                        │
│ THEN: Assign to → Project Lead                                  │
│       Add comment → "High priority issue - immediate attention" │
│       Send Slack notification                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ WHEN: Issue status = "In Progress" for > 5 days                 │
│ THEN: Add label → "stalled"                                     │
│       Notify assignee via email                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Advanced Roadmaps (Portfolio)

Cross-project planning and program management for enterprise.

### Key Features

| Feature | Description |
|---------|-------------|
| **Plans** | Aggregate work from multiple projects/boards into timeline view |
| **Sandbox Mode** | Changes don't affect real issues until explicitly saved |
| **Dependencies** | Visualize blockers across projects on timeline |
| **Capacity Planning** | Define team velocity, calculate over/under capacity |
| **Hierarchy Levels** | Support levels above Epic (Initiative, Theme) |
| **Release Forecasting** | Predict dates based on velocity and dependencies |

### Database Architecture

| Feature | Tables | Notes |
|---------|--------|-------|
| Plan Definitions | `AO_D9132D_PLAN`, `AO_D9132D_ISSUE_SOURCE` | Plan names, access, sources |
| Team Management | `AO_82B313_TEAM`, `AO_D9132D_PLANTEAM` | Private or shared teams |
| Hierarchy Links | `entity_property` (key: `jpo-issue-properties`) | Parent ID, Team ID as JSON |
| Dependencies | `issuelink` | Standard Jira links for timeline deps |

### Important Note

Plan content is **computed at runtime** from issue sources. Database stores configuration, not issue snapshots.

```sql
-- Get issue sources for a plan
SELECT plan."TITLE", plansrc."SOURCE_TYPE", plansrc."SOURCE_VALUE"
FROM "AO_D9132D_ISSUE_SOURCE" plansrc, "AO_D9132D_PLAN" plan
WHERE plansrc."PLAN_ID" = plan."ID";
```

---

## eazyBI Reporting

OLAP-based business intelligence for Jira.

### Architecture

| Component | Description |
|-----------|-------------|
| **OLAP Cubes** | Multidimensional data structures (Issues, Time, Projects) |
| **Measures** | Quantitative data (Issues created, Hours spent) |
| **Dimensions** | Qualitative attributes (Project, Status, Assignee) |
| **MDX Engine** | Query language for calculated members/measures |
| **ETL Import** | Incremental imports (10min/hourly/daily) |

### Visualization Types

- Pivot tables
- Bar/Line/Pie charts
- Scatter/Bubble charts
- Gantt charts
- Agile charts (Velocity, Burndown, Burnup)

### MDX Examples

```mdx
-- Lead Time calculation
DateDiffDays([Measures].[Issue status updated date], Now())

-- Filter releases by date range
Aggregate(
  Filter(
    [Fix Version].[Version].Members,
    DateBetween(
      [Fix Version].CurrentMember.Get('Release date'),
      "1 year ago", "3 month from now"
    )
  )
)

-- Closed sprints ordered by start date
Aggregate(
  Order(
    Filter([Sprint].[Sprint].Members,
      [Sprint].CurrentMember.GetBoolean('Closed')
    ),
    [Sprint].CurrentMember.Get('Start date'),
    BASC
  )
)
```

---

## Structure & BigPicture

### Structure by Tempo

Spreadsheet-like hierarchical views with unlimited levels.

| Feature | Description |
|---------|-------------|
| **Generators** | Dynamic hierarchy builders (Insert, Filter, Sort, Group) |
| **Formulas** | Excel-like calculations across hierarchy |
| **Structured JQL** | Search based on hierarchy position |
| **Gadgets** | Dashboard/Confluence integration |

**Database Tables**: `AO_8BAD1B_FOREST` (hierarchy JSON), `AO_8BAD1B_ROW` (issue mapping)

### BigPicture (PPM Suite)

Full Project Portfolio Management with Gantt, SAFe, and resource management.

| Module | Function |
|--------|----------|
| **Gantt** | Timeline with dependencies, critical path |
| **Scope** | Work Breakdown Structure (WBS) |
| **Board** | Agile/SAFe program board |
| **Roadmap** | Objectives and key results |
| **Risks** | Risk heatmap and tracking |

**SAFe Support**: Native PI Planning, ARTs, cross-team dependencies

---

## DevOps & CI/CD Plugins

| Plugin | Function | Database Tables |
|--------|----------|-----------------|
| **Bitbucket DC** | Commit → issue linking | `AO_E8B6CC_CHANGESET_MAPPING` |
| **Jenkins Integration** | Build status on issues | `AO_E8B6CC_*` |
| **Git Integration** | Multi-repo mapping, PRs | `AO_E8B6CC_REPOSITORY_MAPPING`, `AO_E8B6CC_PULL_REQUEST` |

### Smart Commits

```
PROJ-123 #comment Fixed the login bug #time 2h #done
         ↓              ↓            ↓       ↓
     Issue Key    Add Comment   Log Time  Transition
```

---

## Security & Compliance Plugins

| Plugin | Function | Database Tables |
|--------|----------|-----------------|
| **SAML SSO** | Corporate identity provider | `cwd_directory` config |
| **LDAP Connector** | User/group sync | `cwd_directory`, `cwd_synchronisation_*` |
| **Audit Log** | Compliance tracking | Built-in + `AO_*` for extended |
| **Data Masking** | GDPR compliance | Plugin-specific |
| **OAuth 2.0** | Secure integrations | `AO_FE1BC5_*` |

---

## Plugin Architecture

### How Plugins Work

1. **OSGi Bundles**: Installed under `<jira-home>/plugins/installed-plugins`
2. **Active Objects (AO)**: Each plugin creates `AO_XXXXXX_*` prefixed tables
3. **REST APIs**: Plugins extend `/rest/` namespace
4. **UI Hooks**: Web panels, screens, workflows, navigation items

### Common AO Table Prefixes

| Prefix | Plugin |
|--------|--------|
| `AO_60DB71_*` | Jira Software (Agile) |
| `AO_589059_*` | Automation for Jira |
| `AO_E8B6CC_*` | DVCS/Git Integration |
| `AO_D9132D_*` | Advanced Roadmaps |
| `AO_82B313_*` | Team Management |
| `AO_A415DF_*` | Portfolio Plans |
| `AO_FE1BC5_*` | OAuth2 |
| `AO_4AEACD_*` | Webhooks |
| `AO_81F455_*` | Personal Access Tokens |
| `AO_8BAD1B_*` | Structure |

### Plugin Governance Best Practices

| ❌ Avoid | ✅ Instead |
|----------|-----------|
| Too many plugins | Consolidate with ScriptRunner |
| No DC compatibility check | Verify Data Center certification |
| No staging environment | Always test in non-prod first |
| No governance process | Maintain plugin inventory and owners |

---

## Most-Used Plugins in Enterprise (Ranked)

| Rank | Plugin | Purpose |
|------|--------|---------|
| 1️⃣ | ScriptRunner | Custom logic, automation, bulk ops |
| 2️⃣ | Automation for Jira | No-code rules |
| 3️⃣ | eazyBI | Executive reporting, BI |
| 4️⃣ | Advanced Roadmaps | Cross-project planning |
| 5️⃣ | Structure / BigPicture | Hierarchy, PPM, SAFe |
| 6️⃣ | SAML SSO | Enterprise authentication |
| 7️⃣ | Configuration Manager | Dev→Prod promotion |

---

# PART 3: DATABASE ARCHITECTURE

---

## Executive Summary

This document provides a comprehensive technical analysis of the Jira Data Center PostgreSQL database schema (version 17.5). The schema represents a mature enterprise issue tracking system with approximately **400+ tables**, extensive plugin architecture, and robust workflow management.

### Key Findings
- **Database Engine**: PostgreSQL 17.5
- **Total Tables**: ~400 (200 core + 200 plugin)
- **Plugin Tables**: Prefixed with `AO_XXXXXX_` (Active Objects)
- **Core Schema**: `public` schema only
- **Primary Key Pattern**: Mix of `numeric(18,0)` and `VARCHAR` IDs
- **No Stored Procedures or Custom Functions**: Schema is table-only (no PL/pgSQL functions detected)
- **No Database Views**: Pure table-based architecture
- **Extensive Indexing**: Hundreds of indexes for performance optimization

---

## Database Statistics

| Category | Count |
|----------|-------|
| Core Tables | ~200 |
| Plugin Tables (AO_*) | ~200 |
| Sequences | ~200 |
| Indexes | ~500+ |
| Primary Key Constraints | ~400 |
| Unique Constraints | ~100 |
| Foreign Key Constraints | 0 (enforced at application level) |
| Database Functions | 0 |
| Database Views | 0 |
| Triggers | 0 |

---

## Schema Architecture Overview

The Jira database follows a **modular architecture** with two distinct layers:

### 1. Core Tables (No Prefix)
These are the foundational tables managed by Jira Core:
- Project management
- Issue tracking
- User management
- Workflow engine
- Permissions system

### 2. Plugin Tables (AO_* Prefix)
Active Objects tables created by plugins and add-ons:
- Each plugin has a unique hex identifier (e.g., `AO_60DB71_*`)
- Tables are self-contained within their plugin namespace
- Common plugin families identified:
  - `AO_60DB71_*` - Jira Software (Agile boards, sprints)
  - `AO_589059_*` - Automation for Jira
  - `AO_E8B6CC_*` - DVCS/Git Integration
  - `AO_D9132D_*` - Portfolio/Advanced Roadmaps
  - `AO_A415DF_*` - Portfolio Plans
  - `AO_FE1BC5_*` - OAuth2 Authentication
  - `AO_4AEACD_*` - Webhooks

---

## Core Domain Tables

### 1. Projects & Issues

#### PROJECT
Central project container.

```sql
CREATE TABLE public.project (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    pname character varying(255),           -- Project name
    url character varying(255),             -- Project URL
    lead character varying(255),            -- Project lead user key
    description text,                        -- Project description
    pkey character varying(255),            -- Project key (e.g., "PROJ")
    pcounter numeric(18,0),                 -- Issue counter
    assigneetype numeric(18,0),             -- Default assignee type
    avatar numeric(18,0),                   -- Avatar ID
    originalkey character varying(255),     -- Original key if renamed
    projecttype character varying(255),     -- software, business, etc.
    projecttypestyle character varying(255),
    archived character(1)                   -- 'Y' if archived
);
```

#### JIRAISSUE
The core issue/ticket entity.

```sql
CREATE TABLE public.jiraissue (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    pkey character varying(255),            -- Issue key (e.g., "PROJ-123")
    issuenum numeric(18,0),                 -- Issue number within project
    project numeric(18,0),                  -- FK to project.id
    reporter character varying(255),        -- Reporter user key
    assignee character varying(255),        -- Assignee user key
    creator character varying(255),         -- Creator user key
    issuetype character varying(255),       -- FK to issuetype.id
    summary character varying(255),         -- Issue title
    description text,                       -- Full description
    environment text,                       -- Environment details
    priority character varying(255),        -- FK to priority.id
    resolution character varying(255),      -- FK to resolution.id
    issuestatus character varying(255),     -- FK to issuestatus.id
    created timestamp with time zone,       -- Creation timestamp
    updated timestamp with time zone,       -- Last update timestamp
    duedate timestamp with time zone,       -- Due date
    resolutiondate timestamp with time zone,-- Resolution timestamp
    votes numeric(18,0),                    -- Vote count
    watches numeric(18,0),                  -- Watcher count
    timeoriginalestimate numeric(18,0),     -- Original estimate (seconds)
    timeestimate numeric(18,0),             -- Remaining estimate
    timespent numeric(18,0),                -- Time logged
    workflow_id numeric(18,0),              -- Current workflow instance
    security numeric(18,0),                 -- Security level ID
    fixfor numeric(18,0),                   -- Fix version ID
    component numeric(18,0),                -- Component ID
    archived character(1),                  -- 'Y' if archived
    archivedby character varying(255),      -- User who archived
    archiveddate timestamp with time zone   -- Archive timestamp
);
```

#### ISSUETYPE
Defines types of issues (Bug, Story, Task, etc.).

```sql
CREATE TABLE public.issuetype (
    id character varying(60) NOT NULL PRIMARY KEY,
    sequence numeric(18,0),         -- Display order
    pname character varying(60),    -- Type name
    pstyle character varying(60),   -- Style identifier
    description text,               -- Description
    iconurl character varying(255), -- Icon URL
    avatar numeric(18,0)            -- Avatar ID
);
```

#### ISSUESTATUS
Issue status definitions.

```sql
CREATE TABLE public.issuestatus (
    id character varying(60) NOT NULL PRIMARY KEY,
    sequence numeric(18,0),         -- Display order
    pname character varying(60),    -- Status name
    description text,               -- Description
    iconurl character varying(255), -- Icon URL
    statuscategory numeric(18,0)    -- Category (To Do, In Progress, Done)
);
```

#### PRIORITY
Issue priority levels.

```sql
CREATE TABLE public.priority (
    id character varying(60) NOT NULL PRIMARY KEY,
    sequence numeric(18,0),
    pname character varying(60),
    description text,
    iconurl character varying(255),
    status_color character varying(60)
);
```

#### RESOLUTION
Issue resolution types.

```sql
CREATE TABLE public.resolution (
    id character varying(60) NOT NULL PRIMARY KEY,
    sequence numeric(18,0),
    pname character varying(60),
    description text,
    iconurl character varying(255)
);
```

### 2. User Management

#### APP_USER
Core user identity.

```sql
CREATE TABLE public.app_user (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    user_key character varying(255),    -- Unique user key
    lower_user_name character varying(255) -- Lowercase username for lookups
);
```

#### CWD_USER
Crowd directory user details.

```sql
CREATE TABLE public.cwd_user (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    directory_id numeric(18,0),
    user_name character varying(255),
    lower_user_name character varying(255),
    active numeric(9,0),
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    first_name character varying(255),
    lower_first_name character varying(255),
    last_name character varying(255),
    lower_last_name character varying(255),
    display_name character varying(255),
    lower_display_name character varying(255),
    email_address character varying(255),
    lower_email_address character varying(255),
    external_id character varying(255),
    credential character varying(255)
);
```

#### CWD_GROUP
User groups.

```sql
CREATE TABLE public.cwd_group (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    group_name character varying(255),
    lower_group_name character varying(255),
    active numeric(9,0),
    local numeric(9,0),
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    description character varying(255),
    group_type character varying(60),
    directory_id numeric(18,0)
);
```

#### CWD_MEMBERSHIP
User-group associations.

```sql
CREATE TABLE public.cwd_membership (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    parent_id numeric(18,0),       -- Group ID
    child_id numeric(18,0),        -- User ID
    membership_type character varying(60),
    group_type character varying(60),
    parent_name character varying(255),
    lower_parent_name character varying(255),
    child_name character varying(255),
    lower_child_name character varying(255),
    directory_id numeric(18,0)
);
```

### 3. Workflow System

#### JIRAWORKFLOWS
Workflow definitions stored as XML.

```sql
CREATE TABLE public.jiraworkflows (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    workflowname character varying(255),   -- Workflow name
    creatorname character varying(255),    -- Creator user
    descriptor text,                        -- XML workflow definition
    islocked character varying(60)         -- Lock status
);
```

#### WORKFLOWSCHEME
Associates workflows with projects.

```sql
CREATE TABLE public.workflowscheme (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    name character varying(255),
    description text
);
```

#### WORKFLOWSCHEMEENTITY
Maps issue types to workflows within a scheme.

```sql
CREATE TABLE public.workflowschemeentity (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    scheme numeric(18,0),           -- FK to workflowscheme.id
    workflow character varying(255), -- Workflow name
    issuetype character varying(255) -- Issue type ID or null for default
);
```

### 4. Permissions System

#### SCHEMEPERMISSIONS
Permission entries within permission schemes.

```sql
CREATE TABLE public.schemepermissions (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    scheme numeric(18,0),           -- Scheme ID
    permission numeric(18,0),       -- Permission type
    perm_type character varying(255),
    perm_parameter character varying(255)
);
```

#### PERMISSIONSCHEME
Permission scheme definitions.

```sql
CREATE TABLE public.permissionscheme (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    name character varying(255),
    description text
);
```

#### PROJECTROLE
Project role definitions.

```sql
CREATE TABLE public.projectrole (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    name character varying(255),
    description text
);
```

#### PROJECTROLEACTOR
Associates users/groups with project roles.

```sql
CREATE TABLE public.projectroleactor (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    pid numeric(18,0),              -- Project ID
    projectroleid numeric(18,0),    -- Role ID
    roletype character varying(255),
    roletypeparameter character varying(255)
);
```

### 5. Comments & History

#### JIRAACTION
Issue comments and actions.

```sql
CREATE TABLE public.jiraaction (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    issueid numeric(18,0),          -- FK to jiraissue.id
    author character varying(255),   -- Comment author
    actiontype character varying(255), -- Type of action
    actionlevel character varying(255),
    rolelevel numeric(18,0),
    actionbody text,                 -- Comment body
    created timestamp with time zone,
    updateauthor character varying(255),
    updated timestamp with time zone,
    actionnum numeric(18,0)
);
```

#### CHANGEGROUP
Groups of changes made in a single update.

```sql
CREATE TABLE public.changegroup (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    issueid numeric(18,0),          -- FK to jiraissue.id
    author character varying(255),
    created timestamp with time zone
);
```

#### CHANGEITEM
Individual field changes within a change group.

```sql
CREATE TABLE public.changeitem (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    groupid numeric(18,0),          -- FK to changegroup.id
    fieldtype character varying(255),
    field character varying(255),    -- Field name
    oldvalue text,                   -- Previous value
    oldstring text,                  -- Previous display value
    newvalue text,                   -- New value
    newstring text                   -- New display value
);
```

### 6. Components & Versions

#### COMPONENT
Project components.

```sql
CREATE TABLE public.component (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    project numeric(18,0),          -- FK to project.id
    cname character varying(255),   -- Component name
    description text,
    url character varying(255),
    lead character varying(255),
    assigneetype numeric(18,0),
    ArchiveDate timestamp with time zone
);
```

#### PROJECTVERSION
Version/release definitions.

```sql
CREATE TABLE public.projectversion (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    project numeric(18,0),          -- FK to project.id
    vname character varying(255),   -- Version name
    description text,
    sequence numeric(18,0),
    released character varying(10),
    archived character varying(10),
    url character varying(255),
    startdate timestamp with time zone,
    releasedate timestamp with time zone
);
```

### 7. Custom Fields

#### CUSTOMFIELD
Custom field definitions.

```sql
CREATE TABLE public.customfield (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    customfieldtypekey character varying(255), -- Field type
    customfieldsearcherkey character varying(255),
    cfname character varying(255),  -- Field name
    description text,
    defaultvalue character varying(255),
    fieldtype numeric(18,0),
    project numeric(18,0),
    issuetype character varying(255)
);
```

#### CUSTOMFIELDVALUE
Custom field values for issues.

```sql
CREATE TABLE public.customfieldvalue (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    issue numeric(18,0),            -- FK to jiraissue.id
    customfield numeric(18,0),      -- FK to customfield.id
    parentkey character varying(255),
    stringvalue character varying(255),
    numbervalue double precision,
    textvalue text,
    datevalue timestamp with time zone,
    valuetype character varying(255)
);
```

#### CUSTOMFIELDOPTION
Option values for select-type custom fields.

```sql
CREATE TABLE public.customfieldoption (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    customfield numeric(18,0),      -- FK to customfield.id
    customfieldconfig numeric(18,0),
    parentoptionid numeric(18,0),
    sequence numeric(18,0),
    customvalue character varying(255),
    optiontype character varying(60),
    disabled character varying(60)
);
```

### 8. Attachments & Files

#### FILEATTACHMENT
File attachments on issues.

```sql
CREATE TABLE public.fileattachment (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    issueid numeric(18,0),          -- FK to jiraissue.id
    mimetype character varying(255),
    filename character varying(255),
    created timestamp with time zone,
    filesize numeric(18,0),
    author character varying(255),
    zip numeric(9,0),
    thumbnailable numeric(9,0)
);
```

### 9. Issue Linking

#### ISSUELINK
Links between issues.

```sql
CREATE TABLE public.issuelink (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    linktype numeric(18,0),         -- FK to issuelinktype.id
    source numeric(18,0),           -- Source issue ID
    destination numeric(18,0),       -- Destination issue ID
    sequence numeric(18,0)
);
```

#### ISSUELINKTYPE
Link type definitions.

```sql
CREATE TABLE public.issuelinktype (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    linkname character varying(255), -- Link name
    inward character varying(255),   -- Inward description
    outward character varying(255),  -- Outward description
    pstyle character varying(60),
    "position" numeric(18,0)
);
```

### 10. Time Tracking

#### WORKLOG
Work logged on issues.

```sql
CREATE TABLE public.worklog (
    id numeric(18,0) NOT NULL PRIMARY KEY,
    issueid numeric(18,0),          -- FK to jiraissue.id
    author character varying(255),
    grouplevel character varying(255),
    rolelevel numeric(18,0),
    worklogbody text,               -- Work description
    created timestamp with time zone,
    updateauthor character varying(255),
    updated timestamp with time zone,
    startdate timestamp with time zone,
    timeworked numeric(18,0)         -- Time in seconds
);
```

---

## Plugin Tables (AO_* Prefix)

### Jira Software / Agile (AO_60DB71_*)

#### AO_60DB71_SPRINT
Sprint definitions for Scrum boards.

```sql
CREATE TABLE public."AO_60DB71_SPRINT" (
    "ID" bigint NOT NULL PRIMARY KEY,
    "COMPLETE_DATE" bigint,         -- Completion timestamp
    "END_DATE" bigint,              -- End date timestamp
    "GOAL" text,                     -- Sprint goal
    "NAME" character varying(255),   -- Sprint name
    "RAPID_VIEW_ID" bigint,         -- Board ID
    "SEQUENCE" bigint,              -- Display order
    "START_DATE" bigint,            -- Start date timestamp
    "STARTED" boolean,              -- Has started flag
    "CLOSED" boolean,               -- Is closed flag
    "ISSUE_RANK_DIRTY" boolean      -- Needs re-ranking
);
```

#### AO_60DB71_RAPIDVIEW
Agile board configurations.

```sql
CREATE TABLE public."AO_60DB71_RAPIDVIEW" (
    "ID" bigint NOT NULL PRIMARY KEY,
    "ADMIN_CUSTOM_FIELD_ID" bigint,
    "CARD_COLOR_STRATEGY" character varying(255),
    "FILTER_ID" bigint,             -- Saved filter ID
    "NAME" character varying(255),   -- Board name
    "OWNER_USER_NAME" character varying(255),
    "PROJECT_KEY" character varying(255),
    "RANKING_FIELD_ID" character varying(255),
    "SAVED_FILTER_ID" bigint,
    "SPRINT_SUPPORT_ENABLED" boolean,
    "SWIMLANE_STRATEGY" character varying(255)
);
```

#### AO_60DB71_COLUMN
Board columns (workflow mapping).

```sql
CREATE TABLE public."AO_60DB71_COLUMN" (
    "ID" bigint NOT NULL PRIMARY KEY,
    "COLUMN_MAX" integer,            -- WIP limit max
    "COLUMN_MIN" integer,            -- WIP limit min
    "NAME" character varying(255),   -- Column name
    "POSITION" integer,              -- Display order
    "RAPID_VIEW_ID" bigint          -- FK to board
);
```

#### AO_60DB71_SWIMLANE
Swimlane configurations.

```sql
CREATE TABLE public."AO_60DB71_SWIMLANE" (
    "DESCRIPTION" character varying(255),
    "ID" bigint NOT NULL PRIMARY KEY,
    "NAME" character varying(255),
    "POSITION" integer,
    "QUERY" character varying(255),  -- JQL query
    "RAPID_VIEW_ID" bigint,
    "SWIMLANE_DEFAULT" boolean       -- Is default swimlane
);
```

#### AO_60DB71_LEXORANK
Issue ranking (LexoRank algorithm).

```sql
CREATE TABLE public."AO_60DB71_LEXORANK" (
    "ID" bigint NOT NULL PRIMARY KEY,
    "BUCKET" integer,
    "FIELD_ID" bigint,
    "ISSUE_ID" bigint,              -- Issue ID
    "LOCK_HASH" character varying(255),
    "LOCK_TIME" bigint,
    "RANK" character varying(255),   -- LexoRank value
    "TYPE" integer
);
```

### Automation for Jira (AO_589059_*)

#### AO_589059_RULE_CONFIG
Automation rule definitions.

```sql
CREATE TABLE public."AO_589059_RULE_CONFIG" (
    "AUTHOR_KEY" character varying(255),
    "CLIENT_KEY" character varying(255),
    "CREATED" timestamp without time zone,
    "DESCRIPTION" text,
    "ID" bigint NOT NULL PRIMARY KEY,
    "IS_TEMPLATE" boolean,
    "MIGRATED_ID" bigint,
    "NAME" character varying(255),   -- Rule name
    "STATE" character varying(255),  -- ENABLED, DISABLED
    "TAGS" text,
    "TRIGGER_COMPONENT_ID" bigint,
    "UPDATED" timestamp without time zone
);
```

#### AO_589059_RULE_CFG_COMPONENT
Rule components (triggers, conditions, actions).

```sql
CREATE TABLE public."AO_589059_RULE_CFG_COMPONENT" (
    "COMPONENT" character varying(255), -- Component type
    "CONDITION_PARENT_ID" bigint,
    "ID" bigint NOT NULL PRIMARY KEY,
    "PARENT_CFG_COMPONENT_ID" bigint,
    "RULE_CONFIG_ID" bigint,        -- FK to rule
    "SCHEMA_VERSION" integer,
    "SEQUENCE" integer,
    "TYPE" character varying(255),   -- TRIGGER, CONDITION, ACTION
    "VALUE" text                     -- JSON configuration
);
```

#### AO_589059_AUDIT_ITEM
Automation execution audit log.

```sql
CREATE TABLE public."AO_589059_AUDIT_ITEM" (
    "AUTHOR_KEY" character varying(255),
    "CATEGORY" character varying(255),
    "CLIENT_KEY" character varying(255),
    "CREATED" timestamp without time zone,
    "DESCRIPTION" text,
    "DURATION" bigint,
    "END_TIME" timestamp without time zone,
    "END_TO_END_DURATION" bigint,
    "EVENT_SOURCE" character varying(255),
    "ID" bigint NOT NULL PRIMARY KEY,
    "OBJECT_ITEM_ID" bigint,
    "OBJECT_ITEM_NAME" character varying(255),
    "OBJECT_ITEM_PARENT_ID" character varying(255),
    "OBJECT_ITEM_PARENT_NAME" character varying(255),
    "OBJECT_ITEM_TYPE" character varying(255),
    "START_TIME" timestamp without time zone,
    "SUMMARY" character varying(255)
);
```

### DVCS/Git Integration (AO_E8B6CC_*)

#### AO_E8B6CC_REPOSITORY_MAPPING
Connected Git repositories.

```sql
CREATE TABLE public."AO_E8B6CC_REPOSITORY_MAPPING" (
    "ACTIVITY_LAST_SYNC" timestamp without time zone,
    "DELETED" boolean,
    "FORK" boolean,
    "FORK_OF_NAME" character varying(255),
    "FORK_OF_OWNER" character varying(255),
    "FORK_OF_SLUG" character varying(255),
    "ID" integer NOT NULL PRIMARY KEY,
    "LAST_CHANGESET_NODE" character varying(255),
    "LAST_COMMIT_DATE" timestamp without time zone,
    "LINKED" boolean,
    "LOGO" text,
    "NAME" character varying(255),
    "ORGANIZATION_ID" integer,
    "SLUG" character varying(255),
    "SMARTCOMMITS_ENABLED" boolean,
    "UPDATE_LINK_AUTHORISED" boolean
);
```

#### AO_E8B6CC_CHANGESET_MAPPING
Git commits linked to Jira issues.

```sql
CREATE TABLE public."AO_E8B6CC_CHANGESET_MAPPING" (
    "AUTHOR" character varying(255),
    "AUTHOR_EMAIL" character varying(255),
    "BRANCH" character varying(255),
    "DATE" timestamp without time zone,
    "FILE_COUNT" integer,
    "FILE_DETAILS_JSON" text,
    "FILES_DATA" text,
    "ID" integer NOT NULL PRIMARY KEY,
    "ISSUE_KEY" character varying(255),
    "MESSAGE" text,
    "NODE" character varying(255),   -- Commit hash
    "PARENTS_DATA" character varying(255),
    "PROJECT_KEY" character varying(255),
    "RAW_AUTHOR" character varying(255),
    "RAW_NODE" character varying(255),
    "REPOSITORY_ID" integer,
    "SMARTCOMMIT_AVAILABLE" boolean,
    "VERSION" integer
);
```

#### AO_E8B6CC_PULL_REQUEST
Pull request information.

```sql
CREATE TABLE public."AO_E8B6CC_PULL_REQUEST" (
    "AUTHOR" character varying(255),
    "COMMENT_COUNT" integer,
    "CREATED_ON" timestamp without time zone,
    "DESTINATION_BRANCH" character varying(255),
    "DOMAIN_ID" integer,
    "EXECUTED_BY" character varying(255),
    "ID" integer NOT NULL PRIMARY KEY,
    "LAST_STATUS" character varying(255),
    "NAME" character varying(255),
    "REMOTE_ID" bigint,
    "SOURCE_BRANCH" character varying(255),
    "SOURCE_REPO" character varying(255),
    "TO_REPOSITORY_ID" integer,
    "UPDATED_ON" timestamp without time zone,
    "URL" character varying(255)
);
```

### Webhooks (AO_4AEACD_*)

#### AO_4AEACD_WEBHOOK_DAO
Webhook configurations.

```sql
CREATE TABLE public."AO_4AEACD_WEBHOOK_DAO" (
    "ENABLED" boolean,
    "ENCODED_EVENTS" character varying(255),
    "EXCLUDE_BODY" boolean,
    "FILTER" text,
    "ID" integer NOT NULL PRIMARY KEY,
    "JQL" text,
    "LAST_UPDATED" timestamp without time zone,
    "LAST_UPDATED_USER" character varying(255),
    "NAME" character varying(255),
    "REGISTRATION_METHOD" character varying(255),
    "URL" text
);
```

### Personal Access Tokens (AO_81F455_*)

#### AO_81F455_PERSONAL_TOKEN
Personal access token storage.

```sql
CREATE TABLE public."AO_81F455_PERSONAL_TOKEN" (
    "CREATED_AT" timestamp without time zone,
    "EXPIRING_AT" timestamp without time zone,
    "HASHED_TOKEN" character varying(255),
    "ID" bigint NOT NULL PRIMARY KEY,
    "LAST_ACCESSED_AT" timestamp without time zone,
    "NAME" character varying(255),
    "NOTIFICATION_STATE" character varying(255),
    "TOKEN_ID" character varying(255),
    "USER_KEY" character varying(255)
);
```

### Advanced Roadmaps / Portfolio (AO_D9132D_* and AO_A415DF_*)

#### AO_D9132D_PLAN
Portfolio plan definitions.

```sql
CREATE TABLE public."AO_D9132D_PLAN" (
    "AUTO_SCHEDULE" boolean,
    "DEFAULT_SPRINT_CAPACITY" bigint,
    "DESCRIPTION" text,
    "ESTIMATE_ERROR_THRESHOLD" integer,
    "ESTIMATION_UNIT_TYPE" character varying(255),
    "ID" bigint NOT NULL PRIMARY KEY,
    "IS_BACKLOG_SHARED" boolean,
    "ISSUE_SOURCE_TYPE" character varying(255),
    "NAME" character varying(255),
    "OWNER" character varying(255),
    "PROGRAM_ID" bigint,
    "STORY_POINT_FIELD_KEY" character varying(255)
);
```

---

## Entity Relationship Diagrams

### Core Issue Management ER Diagram

```mermaid
erDiagram
    PROJECT ||--o{ JIRAISSUE : contains
    PROJECT ||--o{ COMPONENT : has
    PROJECT ||--o{ PROJECTVERSION : has
    PROJECT ||--o{ BOARDPROJECT : assigned_to
    
    JIRAISSUE ||--o{ JIRAACTION : has_comments
    JIRAISSUE ||--o{ CHANGEGROUP : has_history
    JIRAISSUE ||--o{ FILEATTACHMENT : has_attachments
    JIRAISSUE ||--o{ WORKLOG : has_worklogs
    JIRAISSUE ||--o{ ISSUELINK : links_from
    JIRAISSUE ||--o{ ISSUELINK : links_to
    JIRAISSUE ||--o{ CUSTOMFIELDVALUE : has_custom_values
    
    CHANGEGROUP ||--o{ CHANGEITEM : contains
    
    ISSUETYPE ||--o{ JIRAISSUE : categorizes
    ISSUESTATUS ||--o{ JIRAISSUE : current_status
    PRIORITY ||--o{ JIRAISSUE : has_priority
    RESOLUTION ||--o{ JIRAISSUE : resolved_as
    
    ISSUELINKTYPE ||--o{ ISSUELINK : typed_by
    
    CUSTOMFIELD ||--o{ CUSTOMFIELDVALUE : has_values
    CUSTOMFIELD ||--o{ CUSTOMFIELDOPTION : has_options
    
    PROJECT {
        numeric id PK
        varchar pkey "Project Key"
        varchar pname "Project Name"
        varchar lead "Lead User"
        varchar projecttype
    }
    
    JIRAISSUE {
        numeric id PK
        varchar pkey "Issue Key"
        numeric project FK
        varchar summary
        text description
        varchar issuetype FK
        varchar issuestatus FK
        varchar priority FK
        varchar resolution FK
        varchar reporter
        varchar assignee
        timestamp created
        timestamp updated
    }
    
    CHANGEGROUP {
        numeric id PK
        numeric issueid FK
        varchar author
        timestamp created
    }
    
    CHANGEITEM {
        numeric id PK
        numeric groupid FK
        varchar field
        text oldvalue
        text newvalue
    }
```

### User & Permissions ER Diagram

```mermaid
erDiagram
    APP_USER ||--|| CWD_USER : extends
    CWD_USER }|--o{ CWD_MEMBERSHIP : member_of
    CWD_GROUP ||--o{ CWD_MEMBERSHIP : contains
    
    PERMISSIONSCHEME ||--o{ SCHEMEPERMISSIONS : contains
    PROJECTROLE ||--o{ PROJECTROLEACTOR : has_actors
    PROJECT ||--o{ PROJECTROLEACTOR : in_project
    
    APP_USER {
        numeric id PK
        varchar user_key UK
        varchar lower_user_name
    }
    
    CWD_USER {
        numeric id PK
        varchar user_name
        varchar email_address
        varchar display_name
        varchar first_name
        varchar last_name
        numeric active
        numeric directory_id FK
    }
    
    CWD_GROUP {
        numeric id PK
        varchar group_name
        varchar description
        numeric active
        numeric directory_id FK
    }
    
    PROJECTROLE {
        numeric id PK
        varchar name
        text description
    }
    
    PROJECTROLEACTOR {
        numeric id PK
        numeric pid FK
        numeric projectroleid FK
        varchar roletype
        varchar roletypeparameter
    }
```

### Workflow System ER Diagram

```mermaid
erDiagram
    JIRAWORKFLOWS ||--o{ WORKFLOWSCHEMEENTITY : referenced_by
    WORKFLOWSCHEME ||--o{ WORKFLOWSCHEMEENTITY : contains
    PROJECT ||--o| WORKFLOWSCHEME : uses
    
    JIRAWORKFLOWS {
        numeric id PK
        varchar workflowname
        varchar creatorname
        text descriptor "XML Definition"
        varchar islocked
    }
    
    WORKFLOWSCHEME {
        numeric id PK
        varchar name
        text description
    }
    
    WORKFLOWSCHEMEENTITY {
        numeric id PK
        numeric scheme FK
        varchar workflow
        varchar issuetype
    }
```

### Agile / Jira Software ER Diagram

```mermaid
erDiagram
    AO_60DB71_RAPIDVIEW ||--o{ AO_60DB71_SPRINT : has_sprints
    AO_60DB71_RAPIDVIEW ||--o{ AO_60DB71_COLUMN : has_columns
    AO_60DB71_RAPIDVIEW ||--o{ AO_60DB71_SWIMLANE : has_swimlanes
    AO_60DB71_RAPIDVIEW ||--o{ AO_60DB71_CARDCOLOR : has_colors
    AO_60DB71_COLUMN ||--o{ AO_60DB71_COLUMNSTATUS : maps_statuses
    
    AO_60DB71_RAPIDVIEW {
        bigint ID PK
        varchar NAME
        bigint FILTER_ID
        varchar OWNER_USER_NAME
        boolean SPRINT_SUPPORT_ENABLED
    }
    
    AO_60DB71_SPRINT {
        bigint ID PK
        bigint RAPID_VIEW_ID FK
        varchar NAME
        bigint START_DATE
        bigint END_DATE
        text GOAL
        boolean CLOSED
    }
    
    AO_60DB71_COLUMN {
        bigint ID PK
        bigint RAPID_VIEW_ID FK
        varchar NAME
        integer POSITION
        integer COLUMN_MIN
        integer COLUMN_MAX
    }
    
    AO_60DB71_SWIMLANE {
        bigint ID PK
        bigint RAPID_VIEW_ID FK
        varchar NAME
        varchar QUERY
        boolean SWIMLANE_DEFAULT
    }
```

### Git/DVCS Integration ER Diagram

```mermaid
erDiagram
    AO_E8B6CC_ORGANIZATION_MAPPING ||--o{ AO_E8B6CC_REPOSITORY_MAPPING : contains
    AO_E8B6CC_REPOSITORY_MAPPING ||--o{ AO_E8B6CC_CHANGESET_MAPPING : has_commits
    AO_E8B6CC_REPOSITORY_MAPPING ||--o{ AO_E8B6CC_BRANCH : has_branches
    AO_E8B6CC_REPOSITORY_MAPPING ||--o{ AO_E8B6CC_PULL_REQUEST : has_prs
    AO_E8B6CC_PULL_REQUEST ||--o{ AO_E8B6CC_PR_PARTICIPANT : has_reviewers
    
    AO_E8B6CC_ORGANIZATION_MAPPING {
        integer ID PK
        varchar NAME
        varchar HOST_URL
        varchar DVCS_TYPE
    }
    
    AO_E8B6CC_REPOSITORY_MAPPING {
        integer ID PK
        integer ORGANIZATION_ID FK
        varchar NAME
        varchar SLUG
        boolean LINKED
        boolean SMARTCOMMITS_ENABLED
    }
    
    AO_E8B6CC_CHANGESET_MAPPING {
        integer ID PK
        integer REPOSITORY_ID FK
        varchar NODE "Commit Hash"
        varchar AUTHOR
        varchar MESSAGE
        varchar ISSUE_KEY
    }
    
    AO_E8B6CC_PULL_REQUEST {
        integer ID PK
        integer TO_REPOSITORY_ID FK
        varchar NAME
        varchar SOURCE_BRANCH
        varchar DESTINATION_BRANCH
        varchar LAST_STATUS
    }
```

---

## Index Analysis

### Critical Performance Indexes

The schema includes hundreds of indexes optimized for common query patterns:

#### Issue Queries
```sql
CREATE INDEX action_issue ON public.jiraaction (issueid);
CREATE INDEX action_author_created ON public.jiraaction (author, created);
CREATE INDEX attach_issue ON public.fileattachment (issueid);
CREATE INDEX chgitem_chggrp ON public.changeitem (groupid);
CREATE INDEX chggroup_issue ON public.changegroup (issueid);
CREATE INDEX cfvalue_issue ON public.customfieldvalue (issue, customfield);
CREATE INDEX issuelink_src ON public.issuelink (source);
CREATE INDEX issuelink_dest ON public.issuelink (destination);
```

#### Project Queries
```sql
CREATE INDEX issue_proj_status ON public.jiraissue (project, issuestatus);
CREATE INDEX issue_proj_num ON public.jiraissue (project, issuenum);
CREATE INDEX idx_project_key ON public.project (pkey);
```

#### User Queries
```sql
CREATE INDEX uk_user_name_dir_id ON public.cwd_user (lower_user_name, directory_id);
CREATE INDEX uk_user_externalid_dir_id ON public.cwd_user (external_id, directory_id);
CREATE INDEX idx_email_address ON public.cwd_user (lower_email_address);
```

#### Agile/Sprint Queries
```sql
CREATE INDEX index_ao_60db71_spr1794552746 ON "AO_60DB71_SPRINT" ("RAPID_VIEW_ID");
CREATE INDEX index_ao_60db71_lex604083109 ON "AO_60DB71_LEXORANK" ("ISSUE_ID");
CREATE INDEX index_ao_60db71_lex1694305086 ON "AO_60DB71_LEXORANK" ("FIELD_ID", "BUCKET", "RANK");
```

---

## Foreign Key Relationships

**Important Note**: This schema does NOT use database-level foreign key constraints. All referential integrity is enforced at the **application level**. This is a deliberate design choice by Atlassian for:

1. **Performance**: Avoids FK check overhead on inserts/updates
2. **Flexibility**: Allows orphaned records during migrations
3. **Plugin Architecture**: AO_ tables can reference core tables without strict coupling

### Logical Relationships (Application-Enforced)

| Parent Table | Child Table | Relationship |
|--------------|-------------|--------------|
| project | jiraissue | project.id → jiraissue.project |
| jiraissue | jiraaction | jiraissue.id → jiraaction.issueid |
| jiraissue | changegroup | jiraissue.id → changegroup.issueid |
| jiraissue | fileattachment | jiraissue.id → fileattachment.issueid |
| jiraissue | worklog | jiraissue.id → worklog.issueid |
| jiraissue | customfieldvalue | jiraissue.id → customfieldvalue.issue |
| changegroup | changeitem | changegroup.id → changeitem.groupid |
| customfield | customfieldvalue | customfield.id → customfieldvalue.customfield |
| customfield | customfieldoption | customfield.id → customfieldoption.customfield |
| app_user | * | app_user.user_key → *.author/reporter/assignee |
| AO_60DB71_RAPIDVIEW | AO_60DB71_SPRINT | RAPIDVIEW.ID → SPRINT.RAPID_VIEW_ID |

---

## Views, Functions & Stored Procedures

### Analysis Result: None Detected

The schema dump analysis reveals:
- **Database Views**: 0
- **Stored Procedures**: 0
- **User-Defined Functions**: 0
- **Triggers**: 0

Jira Data Center operates as a **pure table-based schema** with all business logic implemented in the Java application layer. This design choice:

1. Keeps the database portable across PostgreSQL, MySQL, Oracle, and SQL Server
2. Centralizes business logic in the application for easier maintenance
3. Allows clustering without complex database replication of procedures

---

## Migration Considerations

### Direct Migration Compatibility ✅

| Source Table | Migration Status | Notes |
|--------------|------------------|-------|
| project | ✅ Direct | Core project data |
| jiraissue | ✅ Direct | Issue records |
| app_user | ✅ Direct | User identities |
| cwd_user | ✅ Direct | User details |
| jiraaction | ✅ Direct | Comments |
| changegroup + changeitem | ✅ Direct | History |
| fileattachment | ✅ Direct | Metadata only (files stored on disk) |
| worklog | ✅ Direct | Time tracking |
| component | ✅ Direct | Components |
| projectversion | ✅ Direct | Versions |
| customfield + customfieldvalue | ✅ Direct | Custom fields |
| issuelink + issuelinktype | ✅ Direct | Links |

### Requires Transformation ⚠️

| Source Table | Migration Status | Notes |
|--------------|------------------|-------|
| jiraworkflows | ⚠️ Parse XML | Workflow definitions stored as XML |
| AO_60DB71_RAPIDVIEW | ⚠️ Mapping | Board configurations |
| AO_60DB71_SPRINT | ⚠️ Mapping | Sprint data |
| AO_589059_RULE_CONFIG | ⚠️ Mapping | Automation rules |
| schemepermissions | ⚠️ Mapping | Permission configurations |

### Plugin-Specific (May Skip) ⏭️

| Prefix | Plugin | Action |
|--------|--------|--------|
| AO_E8B6CC_* | DVCS Connector | Re-connect in new system |
| AO_4AEACD_* | Webhooks | Recreate configurations |
| AO_81F455_* | Personal Tokens | Regenerate tokens |
| AO_ED669C_* | SSO/SAML | Reconfigure |

### ID Strategy Recommendations

1. **Preserve Original IDs**: Maintain `jiraissue.id`, `project.id` as-is
2. **Map User Keys**: `app_user.user_key` is the canonical user identifier
3. **Issue Key Format**: Preserve `PROJECT-123` format
4. **Timestamps**: Maintain original `created`/`updated` timestamps

### Data Volumes to Expect

Based on typical Jira installations:
- **Issues**: Can range from 10K to 10M+
- **Comments**: ~3-5x issue count
- **Change Items**: ~10-20x issue count
- **Custom Field Values**: ~5-10x issue count
- **Attachments**: Varies widely

---

## Summary

This Jira Data Center schema represents a mature, enterprise-grade issue tracking database with:

- **~400 tables** split between core and plugin namespaces
- **Pure table architecture** with no stored procedures or views
- **Application-level referential integrity** (no FK constraints)
- **Extensive indexing** for performance optimization
- **Modular plugin system** via Active Objects (AO_* tables)
- **XML-based workflow storage** requiring parsing for migration

The schema is designed for horizontal scalability and cross-database portability, making it suitable for our application migration with proper field mapping and data transformation.
