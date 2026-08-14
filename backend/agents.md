# AI Coding Assistant — Project Context

This is a student assignment template built with Express.js, libsql, and Drizzle ORM. It provides a working example feature (task CRUD API) that students copy and extend to build their own features. Code should be beginner-readable — prefer clarity over cleverness.

## Directory Structure

```
project-root/
├── index.js                  # Express app setup, middleware, route registration
├── drizzle.config.js         # Drizzle Kit configuration
├── .env                      # Environment variables (PORT, DATABASE_URL)
├── src/
│   ├── db/                   # Database connection, schema definitions, and seed data
│   ├── models/               # Data access functions (CRUD queries)
│   ├── controllers/          # Business logic, input validation, HTTP response formatting
│   ├── routes/               # Route definitions mapping URLs to controller functions
│   ├── utils/                # Shared utilities (error handling)
│   └── frontend/             # Static frontend files (HTML, CSS, JS, components)
├── _extras/
│   ├── api-docs/             # Swagger API documentation setup
│   ├── frontend-prompts/     # AI prompt templates for frontend tasks
│   ├── tests/                # Jest + Supertest test files
│   └── nodemon.json          # Nodemon auto-reload settings
└── .vscode/                  # VS Code settings and recommended extensions
```

## Technology Stack

- **Express.js** — web framework
- **libsql** — SQLite-compatible database
- **Drizzle ORM** — database operations and schema definitions
- **Jest + Supertest** — testing
- **express-validator** — input validation
- **ES Modules** — `import`/`export` syntax, `"type": "module"` in package.json (no CommonJS `require`/`module.exports`)

## Coding Conventions

- Use `async`/`await` for all asynchronous operations. No raw Promise chains or `.then()` callbacks.
- Arrow functions only — no `function` keyword declarations. Use `export const name = () => {}` or `export const name = async () => {}`.
- No `import * as` or `import { x as y }` — avoid the `as` keyword in imports. Name your exports so they can be imported directly without aliasing.
- Use named imports: `import { findAllTasks, findTaskById } from '../models/exampleModel.js'` — not `import * as model from ...`.
- Model function names should be verbose and include the resource name (e.g., `findAllTasks`, `findTaskById`, `insertTask`, `updateTask`, `removeTask` — not `getAll`, `getById`, `create`).
- Follow strict MVC separation:
  - **Models** have no HTTP concerns (no `req`, `res`, no Express imports). They receive a `db` instance and return plain data.
  - **Controllers** validate input, call model functions, and format HTTP responses. Errors are caught with `try`/`catch` and forwarded via `next(error)`.
  - **Routes** only map HTTP methods and paths to controller functions. No business logic.
- Include JSDoc comments (`/** ... */`) on all exported functions.
- Use the `AppError` class and `ERROR_CODES` from `src/utils/_errors.js` for error handling. All error responses follow the shape `{ error: { code, message, status } }`.
- Use `express-validator` for input validation. Declare validation rules inline on routes; check results in controllers with `validationResult(req)`.
- Register new routes in `index.js` **before** the global error handler middleware.

## Database Structure

All database-related code lives in `src/db/`:

- `src/db/schema.js` — Drizzle table schema definitions (single source of truth for DB structure)
- `src/db/connection.js` — Database connection setup (exports the `db` instance)
- `src/db/seed.js` — Seed data, seeding function, and database reset orchestration. This is what `npm run db` runs.

Models in `src/models/` import schemas from `src/db/schema.js` and contain only query functions.

## API Documentation

Swagger docs live in `_extras/api-docs/swagger.js`. This file auto-generates API docs from your Express routes and mounts Swagger UI at `/api-docs` on server startup. Students can add new route files to the `routes` array in `_extras/api-docs/swagger.js` to include them in the docs.

## Extras Directory

The `_extras/` directory contains tooling and support files that students don't need to edit directly:

- `_extras/tests/` — Jest + Supertest test files (run with `npm test`)
- `_extras/api-docs/` — Swagger auto-generation and UI setup
- `_extras/frontend-prompts/` — AI prompt templates for frontend tasks
- `_extras/nodemon.json` — Nodemon configuration for the dev server

## Patterns to Follow

When generating new code, follow the existing example files:

- **New table schema** → add to `src/db/schema.js` following the `tasks` table pattern
- **New seed data** → add to `src/db/seed.js` following the existing seed function pattern
- **New model** → follow `src/models/exampleModel.js` (import schema from `src/db/schema.js`, verbose async arrow functions like `findAllItems`/`findItemById`/`insertItem`/`updateItem`/`removeItem`, `db` as first parameter, JSDoc on exports)
- **New controller** → follow `src/controllers/exampleController.js` (named imports from model — no `import * as`, try/catch with `next(error)`, `validationResult` checks, `AppError` for errors, arrow functions)
- **New route** → follow `src/routes/exampleRoute.js` (named Router export like `exampleRouter`, named imports from controller — no `import * as`, inline validation rules)
- **New route registration** → add `app.use('/api/your-resource', yourRouter)` in `index.js` before the `app.use(errorHandler)` line
- **New test** → copy `_extras/tests/example.test.js`, rename it, and adapt for your new endpoints
