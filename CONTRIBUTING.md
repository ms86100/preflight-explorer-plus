# Contributing to Vertex Work Platform

Thank you for your interest in contributing! This document provides guidelines and standards for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Unprofessional conduct

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun
- Git
- Supabase CLI (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vertex-work-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local Supabase credentials
   ```

4. **Start Supabase locally**
   ```bash
   supabase start
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## Coding Standards

### TypeScript

- **Strict mode enabled**: No `any` types without justification
- **Explicit return types**: All exported functions must have explicit return types
- **Interface over type**: Prefer interfaces for object shapes
- **Readonly by default**: Use `readonly` where possible

```typescript
// ✅ Good
interface UserData {
  readonly id: string;
  readonly email: string;
  displayName: string;
}

export function getUser(id: string): Promise<UserData | null> {
  // implementation
}

// ❌ Bad
export function getUser(id: any) {
  // implementation
}
```

### React Components

- **Functional components only**: No class components
- **Named exports**: Export components by name
- **Props interface**: Define props interface above component
- **Destructure props**: Always destructure in function signature

```typescript
// ✅ Good
interface UserCardProps {
  /** The user to display */
  user: User;
  /** Callback when card is clicked */
  onClick?: (userId: string) => void;
}

export function UserCard({ user, onClick }: UserCardProps): JSX.Element {
  return (/* ... */);
}

// ❌ Bad
export default function(props) {
  return (/* ... */);
}
```

### File Organization

```
src/
├── features/           # Feature-based modules
│   └── {feature}/
│       ├── components/ # React components
│       ├── hooks/      # Custom hooks
│       ├── services/   # API/business logic
│       ├── types/      # Type definitions
│       └── index.ts    # Public exports
├── components/         # Shared UI components
├── hooks/              # Shared hooks
├── lib/                # Utilities and helpers
└── pages/              # Route components
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Services | camelCase with `Service` suffix | `issueService.ts` |
| Types | PascalCase | `UserData` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Files | kebab-case or PascalCase (components) | `user-service.ts` |

### Styling

- **Tailwind CSS**: Use Tailwind utility classes
- **Semantic tokens**: Use design system tokens from `index.css`
- **No inline styles**: Avoid `style` prop
- **Dark mode support**: Test both themes

```typescript
// ✅ Good - uses semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ Bad - hardcoded colors
<div className="bg-white text-black border-gray-200">
```

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `security`: Security-related changes

### Examples

```bash
feat(issues): add bulk status update feature

fix(auth): resolve session timeout not refreshing token

docs(api): add endpoint documentation for issues API

security(rls): add missing policy for attachments table
```

### Commit Best Practices

- **Atomic commits**: One logical change per commit
- **Present tense**: "add feature" not "added feature"
- **Imperative mood**: "change" not "changes"
- **Reference issues**: Include issue number when applicable

## Pull Request Process

### Before Submitting

1. **Update your branch**: Rebase on latest main
2. **Run tests**: `npm run test`
3. **Run linting**: `npm run lint`
4. **Update documentation**: Add/update relevant docs
5. **Self-review**: Review your own changes first

### PR Title Format

Same as commit message format:
```
feat(issues): add bulk status update feature
```

### PR Description Template

```markdown
## Description
[Describe what this PR does]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed my code
- [ ] Added necessary documentation
- [ ] No new warnings generated
- [ ] All tests pass
```

### Review Process

1. **Automated checks**: Must pass CI pipeline
2. **Code review**: At least one approval required
3. **Security review**: Required for security-sensitive changes
4. **Documentation review**: For public API changes

## Testing Requirements

### Unit Tests

- All utility functions must have tests
- All hooks must have tests
- Minimum 80% coverage for new code

```typescript
// Example test
describe('formatDate', () => {
  it('should format date to ISO string', () => {
    const date = new Date('2025-01-01');
    expect(formatDate(date)).toBe('2025-01-01');
  });

  it('should handle null input', () => {
    expect(formatDate(null)).toBe('');
  });
});
```

### Integration Tests

- API endpoint tests
- Database operation tests
- Authentication flow tests

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- path/to/test.spec.ts
```

## Documentation

### TSDoc Comments

All exported functions, classes, and components MUST have TSDoc comments:

```typescript
/**
 * Fetches issues for a project with optional filtering.
 *
 * @param projectId - The unique identifier of the project
 * @param options - Optional filter parameters
 * @returns A promise resolving to an array of issues
 * @throws {SupabaseError} When database query fails
 *
 * @example
 * ```typescript
 * const issues = await getIssues('project-123', { status: 'open' });
 * ```
 */
export async function getIssues(
  projectId: string,
  options?: IssueFilterOptions
): Promise<Issue[]> {
  // implementation
}
```

### README Updates

- Update README for new features
- Include usage examples
- Document environment variables

### API Documentation

- Document all edge function endpoints
- Include request/response examples
- Specify authentication requirements

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues/PRs
3. Open a discussion

---

*Thank you for contributing to Vertex Work Platform!*
