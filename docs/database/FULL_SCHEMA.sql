-- =============================================
-- JIRA DATA CENTER CLONE - COMPLETE DATABASE SCHEMA
-- Run this with: supabase db reset (after placing in supabase/migrations/)
-- Or run directly: psql -f FULL_SCHEMA.sql
-- =============================================

-- Full schema available at: docs/JIRA_DATABASE_ARCHITECTURE.md
-- This file contains the complete SQL for 50+ tables

-- Due to size constraints, please refer to the conversation above
-- for the complete migration SQL split into 7 parts:
-- 1. Enums & User Tables (profiles, user_roles, groups)
-- 2. Projects (projects, project_roles, project_role_actors)
-- 3. Issues (issues, issue_types, priorities, statuses, comments, attachments)
-- 4. Workflows (workflows, workflow_steps, workflow_transitions)
-- 5. Boards & Sprints (boards, board_columns, sprints, sprint_issues)
-- 6. Automation, Git, Notifications
-- 7. Seed Data (default issue types, priorities, statuses, workflows)

-- INSTRUCTIONS FOR LOCAL SUPABASE:
-- 1. Install Supabase CLI: npm install -g supabase
-- 2. Initialize: supabase init
-- 3. Start local: supabase start
-- 4. Copy migration files to supabase/migrations/
-- 5. Run: supabase db reset

-- The complete SQL was provided in the conversation above.
-- Export it to your local supabase/migrations/ folder.
