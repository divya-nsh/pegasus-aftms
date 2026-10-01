# Project Instructions

## Stack

### Frontend

- React + TypeScript
- Tailwind
- TanStack Query
- Tanstack Form
- Tanstack Table
- TRPC Client to connect with backend

### Backend

- Drizzle ORM V1.0.0-rc.4
- PostgreSQL
- TRPC
- Express Session for Authorization

## Rules

- Typescript Imports
  - Always use import type when importing only types.
  - Use regular import only when the imported value is used at runtime.
  - Do not mix type-only and runtime imports unnecessarily.
  - Follow the @typescript-eslint/consistent-type-imports ESLint rule.

- Don't modify unrelated files.
- Don't create abstractions unless they are reused.
- Use TypeScript strictly.
- Keep Code readable, compact and modular
