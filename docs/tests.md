# Tests

## Backend

- `cd apps/api && pytest`: unit and API tests.
- `ruff check apps/api`: static checks.

## Frontend

- `cd apps/client && npm run lint`: ESLint checks.
- `cd apps/client && npm run build`: TypeScript and Vite production build.

The health endpoint is covered by `apps/api/tests/test_health.py`. New routes
should add an API test and document authentication and authorization coverage.