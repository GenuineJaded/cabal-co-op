```markdown
# cabal-co-op Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `cabal-co-op` TypeScript codebase. You'll learn how to structure files, write imports and exports, follow commit message practices, and understand the project's testing approach. This guide is designed to help contributors quickly adapt to the repository's style and workflows.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `messageHandler.ts`

### Import Style
- Both default and named imports are used, but **named imports are preferred**.
  - Example:
    ```typescript
    import { fetchData, saveData } from './dataUtils';
    import config from './config';
    ```

### Export Style
- Use **named exports** for functions, classes, and constants.
  - Example:
    ```typescript
    // Good
    export function connect() { ... }
    export const VERSION = '1.0.0';

    // Avoid default exports
    export default function connect() { ... } // Not preferred
    ```

### Commit Messages
- Freeform style, no strict prefixes.
- Keep messages concise (average length: ~54 characters).
  - Example:
    ```
    Add support for multi-user chat rooms
    Fix bug in message serialization
    ```

## Workflows

_No automated workflows detected in the repository._

## Testing Patterns

- **Test files** use the pattern `*.test.*` (e.g., `userProfile.test.ts`).
- The testing framework is **unknown**, but tests are colocated with source files or in a `tests` directory.
- Example test file name: `messageHandler.test.ts`

  ```typescript
  // Example test file
  import { sendMessage } from './messageHandler';

  describe('sendMessage', () => {
    it('should send a message successfully', () => {
      // test implementation
    });
  });
  ```

## Commands

| Command      | Purpose                                   |
|--------------|-------------------------------------------|
| /test        | Run all test files (*.test.*)             |
| /lint        | Lint the codebase for style consistency   |
| /build       | Build the TypeScript project              |

```
