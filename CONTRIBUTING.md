# Contributing Guide

Thanks for contributing to the CV Management Platform!

Your contribution helps improve the platform for everyone. This guide explains how to contribute effectively.

## Who Can Contribute

- **Backend developers**: Add features, fix bugs, improve tests
- **DevOps/Infrastructure**: Database, CI/CD, deployment improvements
- **Documentation**: Improve guides, examples, error messages
- **Everyone**: Bug reports, feedback, code reviews

## Getting Started

### 1. Local Setup

```bash
cd backend
pnpm install
cp .env.example .env
pnpm run db:init
pnpm run start:dev
```

Verify the setup:
```bash
curl http://localhost:3000/api/v1/  # Should return 200
curl http://localhost:3000/api/docs  # Swagger UI
```

### 2. Run Tests Before Making Changes

```bash
pnpm run test:unit        # Quick local tests
pnpm run test:integration # Docker-backed tests
pnpm run lint             # Check code style
```

## Contribution Workflow

### Step 1: Create a Branch

Use descriptive names:
```
feat/cv-pdf-generation
feat/add-payment-provider
fix/jwt-expiry-validation
docs/improve-deployment-guide
test/add-cv-generation-tests
refactor/simplify-payment-handler
```

### Step 2: Make Your Changes

Follow these principles:
- **Small, focused changes**: One feature or bug fix per PR
- **Clear code**: Prefer readability over cleverness
- **Add tests**: For any behavior change (unit or integration)
- **No secrets**: Never commit `.env` files or credentials

### Step 3: Commit Messages

Write clear, explicit commit messages:

```
feat: add PDF export to CV generation

- Implement PDF template for CV data
- Add cv-generation service method
- Include unit tests

fix: validate idempotency key before checkout processing

docs: add payment provider integration guide

test: add CV generation integration tests with mock AI service
```

**Format**: `<type>: <description>`

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `perf`

### Step 4: Test Locally

```bash
cd backend

# Code quality
pnpm run lint
pnpm run format

# Tests
pnpm run test:unit
pnpm run test:integration  # Requires Docker running

# Build check
pnpm run build
```

All checks must pass before opening a PR.

### Step 5: Open a Pull Request

Include in the PR description:
- What problem does this solve?
- How were changes tested?
- Any breaking changes?
- Links to related issues

Example PR title:
```
feat: implement AI-powered CV generation with PDF export
```

Example PR description:
```
## What
Adds ability to generate professional CVs from user profile data using AI prompt.

## How
- New `cv-generation` module with AI integration
- PDF export using pdfkit library
- Idempotent CV regeneration with custom prompts

## Testing
- Unit tests: 12 new tests, all passing
- Integration tests: Added 5 integration tests
- Manual: Tested PDF generation with sample data

## Checklist
- [x] Code follows project style
- [x] Tests added/updated
- [x] No hardcoded secrets
- [x] Documentation updated
```

## Issue Reporting

When reporting a bug, provide:

1. **Clear title**: "JWT refresh fails after 10 days" (not "Auth broken")
2. **Description**: What happened vs. what you expected
3. **Steps to reproduce**: Clear, step-by-step instructions
4. **Environment**: Node version, OS, Docker version if relevant
5. **Logs**: Error messages, stack traces if available

Example issue:
```
**Title**: Refresh token fails when session expires mid-flow

**Description**
When a user is idle for 7+ days (refresh token lifetime), 
attempting to refresh returns 401 instead of asking them to login.

**Steps**
1. Create user account
2. Wait 7 days
3. Call POST /api/v1/auth/refresh-token

**Expected**
Clear error message directing to login endpoint

**Actual**
500 Internal Server Error

**Environment**
- Node: 20.11.1
- OS: macOS 14.2
- DB: PostgreSQL 16 (Docker)
```

## Code Standards

### Architecture

- **Modular design**: Each feature in its own module/folder
- **Service abstraction**: Use ports/adapters for external dependencies
- **Entity-driven**: Domain entities drive feature logic
- **Error handling**: Custom error classes in `*.errors.ts` files

### Testing

- **Unit tests**: Test business logic in isolation
- **Integration tests**: Test features end-to-end with real DB
- **Naming**: `*.spec.ts` for units, `*.integration-spec.ts` for integration

### File Organization

```
src/modules/feature-name/
├── entities/
│   ├── feature.entity.ts
│   └── feature-status.enum.ts
├── features/
│   ├── create-feature.handler.ts
│   ├── update-feature.handler.ts
│   └── delete-feature.handler.ts
├── services/
│   ├── feature.service.ts
│   └── external-provider.interface.ts
├── feature.errors.ts
└── feature.module.ts
```

### Database Migrations

When adding database changes:

1. Create a new migration:
   ```bash
   pnpm run db:migration:generate src/database/migrations/auto -d src/database/data-source.ts
   ```

2. Review the generated migration file
3. Test locally:
   ```bash
   pnpm run db:migration:run
   pnpm run db:migration:revert  # Test rollback
   pnpm run db:migration:run     # Run again
   ```

4. Include migration in your PR

## Questions?

- Check [README.md](README.md) for architecture and setup
- Review existing code patterns in the `src/modules/` directory
- Open a discussion issue if you need clarification
pnpm run lint
pnpm run test:unit
pnpm run test:integration
```

If Docker is unavailable locally, mention it in your PR and run at least:

```bash
cd backend
pnpm run lint
pnpm run test:unit
```

Your PR should include:

- What changed
- Why it changed
- How it was tested
- Any migration or env changes

## Code Expectations

- Follow existing NestJS module and feature-handler patterns.
- Keep API behavior explicit and documented.
- Reuse existing error patterns for consistent responses.
- Prefer migration-first database changes.

## Documentation Expectations

Update docs when your change affects:

- API routes or payloads
- Environment variables
- Setup or run commands
- Architecture or flow behavior

## Security Issues

Do not open a public issue for sensitive vulnerabilities.

Share details privately with repository maintainers first.

## Review and Merge

A good PR is:

- Small enough to review quickly
- Covered by tests
- Clear about behavior changes
- Backward-compatible when possible

Maintainers may request changes before merge. That is normal and part of quality control.

## First Contribution Ideas

- Improve error message clarity
- Add missing API docs examples
- Add unit tests for edge cases
- Improve developer setup instructions
- Add payment provider adapter behind the payment service interface

## Thank You

Every contribution improves this template for the next team.

Whether you fix one typo or ship a full feature, it matters.
