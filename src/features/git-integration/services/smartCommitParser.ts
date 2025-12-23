// Smart Commit Parser
// Parses commit messages for Jira issue keys and smart commit commands
// Based on Jira Data Center smart commits: https://support.atlassian.com/jira-software-cloud/docs/process-issues-with-smart-commits/

import type { ParsedSmartCommit, SmartCommitAction } from '../types';

// Matches Jira issue keys like PROJ-123, ABC-1, TEST-9999
// Using bounded quantifiers to prevent ReDoS: project key 2-10 chars, issue number 1-8 digits
const ISSUE_KEY_PATTERN = /\b([A-Z][A-Z0-9]{1,9}-\d{1,8})\b/g;

// Smart commit command patterns - Optimized to prevent catastrophic backtracking (ReDoS)
// Using explicit character classes instead of .+? and bounded quantifiers
const COMMENT_PATTERN = /#comment\s+([^#\n]{1,500})/gi;
const TIME_PATTERN = /#time\s+(\d{1,3}[wdhm](?:\s*\d{1,3}[wdhm]){0,3})/gi;
const TRANSITION_PATTERNS: Record<string, RegExp> = {
  resolve: /#(?:resolve|done|close|fixed|closes|fixes)\b/gi,
  'in-progress': /#(?:in-progress|start|working|wip)\b/gi,
  reopen: /#(?:reopen|open)\b/gi,
  review: /#(?:review|code-review|pr)\b/gi,
};

/**
 * Extract all Jira issue keys from a commit message
 */
export function extractIssueKeys(message: string): string[] {
  const matches = message.match(ISSUE_KEY_PATTERN);
  if (!matches) return [];
  
  // Remove duplicates and return unique keys
  return [...new Set(matches)];
}

/**
 * Parse smart commit commands from a commit message
 */
// Helper: Add action for all issue keys (reduces nested loops in main function)
function addActionsForAllIssues(
  actions: SmartCommitAction[],
  issueKeys: string[],
  type: SmartCommitAction['type'],
  value: string
): void {
  for (const issueKey of issueKeys) {
    actions.push({ type, value, issueKey });
  }
}

// Helper: Parse comment commands (S3776 fix - extract loop)
function parseCommentCommands(message: string, issueKeys: string[], actions: SmartCommitAction[]): void {
  const commentMatches = message.matchAll(COMMENT_PATTERN);
  for (const match of commentMatches) {
    const commentText = match[1].trim();
    if (commentText) {
      addActionsForAllIssues(actions, issueKeys, 'comment', commentText);
    }
  }
}

// Helper: Parse time commands (S3776 fix - extract loop)
function parseTimeCommands(message: string, issueKeys: string[], actions: SmartCommitAction[]): void {
  const timeMatches = message.matchAll(TIME_PATTERN);
  for (const match of timeMatches) {
    const timeValue = match[0].replace('#time', '').trim();
    if (timeValue) {
      addActionsForAllIssues(actions, issueKeys, 'time', timeValue);
    }
  }
}

// Helper: Parse transition commands (S3776 fix - extract loop)
function parseTransitionCommands(message: string, issueKeys: string[], actions: SmartCommitAction[]): void {
  for (const [transitionName, pattern] of Object.entries(TRANSITION_PATTERNS)) {
    if (pattern.test(message)) {
      addActionsForAllIssues(actions, issueKeys, 'transition', transitionName);
      pattern.lastIndex = 0; // Reset regex lastIndex for next use
    }
  }
}

/**
 * Parse smart commit commands from a commit message
 */
export function parseSmartCommitActions(message: string, issueKeys: string[]): SmartCommitAction[] {
  const actions: SmartCommitAction[] = [];
  
  if (issueKeys.length === 0) return actions;
  
  parseCommentCommands(message, issueKeys, actions);
  parseTimeCommands(message, issueKeys, actions);
  parseTransitionCommands(message, issueKeys, actions);
  
  return actions;
}

/**
 * Parse a commit message for issue keys and smart commit commands
 */
export function parseSmartCommit(message: string): ParsedSmartCommit {
  const issueKeys = extractIssueKeys(message);
  const actions = parseSmartCommitActions(message, issueKeys);
  
  return {
    issueKeys,
    actions,
    rawMessage: message,
  };
}

/**
 * Parse time string to minutes
 * Supports formats: 1w, 2d, 3h, 30m, 1w 2d 3h 30m
 */
export function parseTimeToMinutes(timeString: string): number {
  let totalMinutes = 0;
  
  const weekMatch = /(\d+)w/i.exec(timeString);
  const dayMatch = /(\d+)d/i.exec(timeString);
  const hourMatch = /(\d+)h/i.exec(timeString);
  const minuteMatch = /(\d+)m/i.exec(timeString);
  
  if (weekMatch) totalMinutes += Number.parseInt(weekMatch[1]) * 5 * 8 * 60; // 5 days, 8 hours
  if (dayMatch) totalMinutes += Number.parseInt(dayMatch[1]) * 8 * 60; // 8 hours
  if (hourMatch) totalMinutes += Number.parseInt(hourMatch[1]) * 60;
  if (minuteMatch) totalMinutes += Number.parseInt(minuteMatch[1]);
  
  return totalMinutes;
}

/**
 * Format minutes to a human-readable time string
 */
export function formatMinutesToTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 8) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 8);
  const remainingHours = hours % 8;
  
  if (days < 5) {
    let result = `${days}d`;
    if (remainingHours > 0) result += ` ${remainingHours}h`;
    if (remainingMinutes > 0) result += ` ${remainingMinutes}m`;
    return result;
  }
  
  const weeks = Math.floor(days / 5);
  const remainingDays = days % 5;
  
  let result = `${weeks}w`;
  if (remainingDays > 0) result += ` ${remainingDays}d`;
  if (remainingHours > 0) result += ` ${remainingHours}h`;
  
  return result;
}

/**
 * Check if a commit message contains any smart commit commands
 */
export function hasSmartCommitCommands(message: string): boolean {
  return (
    COMMENT_PATTERN.test(message) ||
    TIME_PATTERN.test(message) ||
    Object.values(TRANSITION_PATTERNS).some(pattern => {
      const result = pattern.test(message);
      pattern.lastIndex = 0; // Reset for reuse
      return result;
    })
  );
}

/**
 * Generate a branch name from an issue key and optional description
 */
export function generateBranchName(
  issueKey: string,
  description?: string,
  prefix: string = 'feature'
): string {
  let branchName = `${prefix}/${issueKey.toLowerCase()}`;
  
  if (description) {
    // Sanitize description for branch name
    const sanitized = description
      .toLowerCase()
      .split(/[^a-z0-9\s-]/).join('')
      .trim()
      .split(/\s+/).join('-')
      .substring(0, 50);
    
    if (sanitized) {
      branchName += `-${sanitized}`;
    }
  }
  
  return branchName;
}
