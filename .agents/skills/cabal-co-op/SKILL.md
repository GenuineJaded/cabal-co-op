```markdown
# cabal-co-op Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `cabal-co-op` TypeScript codebase. You'll learn about file naming, import/export styles, commit patterns, and how to write and run tests. The repository does not use a specific framework and follows a set of custom conventions for organizing and maintaining code.

## Coding Conventions

### File Naming
- **Style:** camelCase
- **Example:**  
  - `userProfile.ts`
  - `messageHandler.ts`

### Import Style
- **Mixed usage:** Both default and named imports may be used.
- **Examples:**
  ```typescript
  import { fetchUser } from './userService';
  import utils from './utils';
  ```

### Export Style
- **Named exports are preferred.**
- **Example:**
  ```typescript
  // userService.ts
  export function fetchUser(id: string) { ... }
  export const USER_ROLE = 'admin';
  ```

### Commit Patterns
- **Type:** Freeform (no enforced structure)
- **Prefixes:** Not required
- **Average length:** ~48 characters
- **Example:**  
  ```
  Fix message rendering bug in chat window
  ```

## Workflows

### Adding a New Feature
**Trigger:** When you need to implement a new feature.
**Command:** `/add-feature`

1. Create a new TypeScript file using camelCase naming.
2. Write your feature code, using named exports.
3. Import any dependencies using mixed import style as needed.
4. Add or update relevant test files (`*.test.ts`).
5. Commit your changes with a clear, concise message.

### Fixing a Bug
**Trigger:** When a bug is reported or discovered.
**Command:** `/fix-bug`

1. Locate the relevant file(s) using camelCase naming.
2. Apply your fix, maintaining code style conventions.
3. Update or add tests in the corresponding `*.test.ts` file.
4. Commit your fix with a descriptive message.

### Writing Tests
**Trigger:** When adding new code or updating existing logic.
**Command:** `/write-tests`

1. Create or update a test file matching the pattern `*.test.ts`.
2. Write test cases for your code (testing framework is not specified).
3. Ensure tests cover both typical and edge cases.
4. Run your tests to verify correctness.

## Testing Patterns

- **File Pattern:** Test files are named with the pattern `*.test.ts`.
- **Framework:** Not explicitly specified—use your preferred TypeScript-compatible testing framework.
- **Example:**
  ```typescript
  // userService.test.ts
  import { fetchUser } from './userService';

  test('fetchUser returns correct user', () => {
    expect(fetchUser('123')).toEqual({ id: '123', name: 'Alice' });
  });
  ```

## Commands
| Command      | Purpose                                      |
|--------------|----------------------------------------------|
| /add-feature | Steps for adding a new feature               |
| /fix-bug     | Steps for fixing a bug                       |
| /write-tests | Steps for writing or updating test coverage   |
```