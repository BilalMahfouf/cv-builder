# CV Management Platform

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3-262627?logo=typeorm&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![PNPM](https://img.shields.io/badge/PNPM-10-F69220?logo=pnpm&logoColor=white)

A production-ready backend platform for managing user profiles and generating professional CVs with AI assistance.

**Core Features:**
- User authentication (register, login, profile management)
- Payment processing with idempotency
- **[Upcoming]** AI-powered CV generation from user data (PDF export)
- PostgreSQL + TypeORM with automated migrations
- Comprehensive API documentation and test coverage

## Table of Contents

- [Overview](#overview)
- [High-Level System Design](#high-level-system-design)
- [Core Modules](#core-modules)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

This backend serves a career platform where users can:
1. Create and manage their professional profiles
2. Pay for CV generation services
3. Generate professional CVs using AI (coming soon)
4. Download CVs in PDF format

The API is RESTful, fully authenticated with JWT, and production-ready.

## High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Apps                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    /api/v1 endpoints
                           │
        ┌──────────────────┴──────────────────┬────────────────┐
        │                                     │                │
    ┌───▼──────┐                    ┌────────▼──────┐   ┌─────▼────┐
    │ Auth     │                    │ Users Module  │   │ Payments │
    │ Service  │                    │ (Profile)     │   │ Module   │
    └───┬──────┘                    └────────┬──────┘   └─────┬────┘
        │                                    │                │
        └────────────────┬───────────────────┴────────────────┘
                         │
                   TypeORM Repositories
                         │
                    ┌────▼────┐
                    │ PostgreSQL
                    │ Database
                    └─────────┘
        
        [Upcoming] CV Generation Module
        ┌─────────────────────────┐
        │ AI CV Generator         │
        │ • Process user data     │
        │ • Generate CV content   │
        │ • Export to PDF         │
        └─────────────────────────┘
```

### Architecture Highlights

- **Modular design**: Auth, Users, Payments, and CV generation as independent modules
- **API versioning**: All endpoints prefixed with `/api/v1`
- **Authentication**: JWT access tokens + secure HTTP-only refresh cookies
- **Idempotency**: Payment operations support `idempotency-key` header
- **Database-first migrations**: Schema changes tracked and versioned
- **Auto-migration**: Migrations apply on dev startup; manual control in production

## Core Modules

### 1. Users Module
Handles user registration, authentication, and profile management.

**Endpoints:**
- `POST /api/v1/auth/register` - Create new user account
- `POST /api/v1/auth/login` - Authenticate user
- `POST /api/v1/auth/refresh` - Get new access token
- `POST /api/v1/auth/logout` - Invalidate session
- `POST /api/v1/auth/forget-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Complete password reset
- `GET /api/v1/auth/me` - Get authenticated user
- `PATCH /api/v1/users/profile` - Update user profile
- `PATCH /api/v1/users/email` - Change email
- `PATCH /api/v1/users/password` - Change password

### 2. Payments Module
Processes payments for CV generation services.

**Endpoints:**
- `POST /api/v1/payments/checkout` - Create payment checkout (supports idempotency)

**Features:**
- Idempotent operations via `idempotency-key` header
- Payment service abstraction for easy provider integration
- Transaction tracking and status management

### 3. CV Generation Module (Upcoming)
AI-powered CV generation and management.

**Features (In Development):**
- Extract user profile data
- Generate professional CV content via AI prompt
- Export CV as PDF
- Store generated CVs for retrieval
- Regenerate with custom prompts

## Quick Start

### Prerequisites

- Node.js LTS (20+ recommended)
- pnpm 10+
- PostgreSQL 16+
- Docker (for integration tests)

### Installation

```bash
cd backend
pnpm install
cp .env.example .env
pnpm run db:init
pnpm run start:dev
```

The API will be available at `http://localhost:3000/api/v1` and Swagger docs at `http://localhost:3000/api/docs`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP server port (default: `3000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `DATABASE_HOST` | Yes | PostgreSQL hostname |
| `DATABASE_PORT` | Yes | PostgreSQL port (default: `5432`) |
| `DATABASE_USERNAME` | Yes | PostgreSQL user |
| `DATABASE_PASSWORD` | Yes | PostgreSQL password |
| `DATABASE_NAME` | Yes | Target database name |
| `JWT_SECRET_KEY` | Yes | Secret key for signing JWT tokens |
| `JWT_ISSUER` | Yes | JWT issuer identifier |
| `JWT_AUDIENCE` | Yes | JWT audience identifier |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | No | Access token lifetime (default: `50`) |
| `REFRESH_TOKEN_COOKIE_NAME` | No | Cookie name (default: `refreshToken`) |
| `REFRESH_TOKEN_DAYS` | No | Refresh token lifetime in days (default: `7`) |

## Database Setup

The database follows a **migration-first approach** (`synchronize: false`).

```bash
pnpm run db:create               # Create database
pnpm run db:migration:run        # Apply pending migrations
pnpm run db:migration:revert     # Revert last migration
pnpm run db:migration:generate   # Generate migration from entities
pnpm run db:init                 # Create DB + apply migrations
```

On development startup, pending migrations auto-apply. In production, migrations are manual.

## Running Tests

```bash
pnpm run test               # Run all tests
pnpm run test:unit          # Unit tests only
pnpm run test:integration   # Integration tests (Docker required)
pnpm run test:cov           # Generate coverage report
pnpm run test:watch         # Watch mode
```

## Project Structure

```
backend/
├── src/
│   ├── common/
│   │   ├── auth/           # JWT strategy, guards, decorators
│   │   ├── domain/         # Base entity and domain primitives
│   │   └── swagger/        # API documentation setup
│   ├── database/
│   │   ├── migrations/     # SQL schema migrations
│   │   ├── create-database.ts
│   │   ├── data-source.ts
│   │   └── typeorm.config.ts
│   ├── modules/
│   │   ├── users/          # User auth and profile management
│   │   ├── payments/       # Payment processing
│   │   └── (cv-generation) # Upcoming AI CV module
│   ├── app.module.ts
│   └── main.ts
├── tests/
│   ├── unit-tests/         # Unit test suite
│   ├── integration/        # Integration tests (Docker)
│   └── e2e/                # End-to-end tests
└── package.json
```

## API Documentation

Full API docs (auto-generated): `GET /api/docs`

### Authentication Endpoints
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Authenticate
- `POST /api/v1/auth/refresh-token` - Get new access token
- `POST /api/v1/auth/logout` - End session
- `POST /api/v1/auth/forget-password` - Request password reset
- `PUT /api/v1/auth/reset-password` - Complete password reset
- `GET /api/v1/auth/me` - Get authenticated user

### User Profile Endpoints
- `PATCH /api/v1/users/profile` - Update profile
- `PATCH /api/v1/users/email` - Change email
- `PATCH /api/v1/users/password` - Change password

### Payment Endpoints
- `POST /api/v1/payments/checkout` - Create payment checkout

### CV Generation (Upcoming)
- `POST /api/v1/cv/generate` - Generate CV from user data with AI prompt
- `GET /api/v1/cv/:id/download` - Download generated CV as PDF
- `GET /api/v1/cv/list` - List user's generated CVs

## Security Notes

- **Access Token**: Sent in `Authorization: Bearer <token>` header; 50-minute lifetime
- **Refresh Token**: Stored in HTTP-only secure cookie; 7-day lifetime
- **Password Storage**: Hashed with bcrypt
- **Idempotency**: Payment endpoints support `idempotency-key` header to prevent duplicate charges

For production:
- Store `JWT_SECRET_KEY` in a secure vault (AWS Secrets Manager, Vault, etc.)
- Ensure HTTPS/TLS on all endpoints
- Enable CORS with specific allowed origins
- Implement rate limiting on auth endpoints
- Add request logging and monitoring

## Development

```bash
pnpm run lint                # ESLint check
pnpm run format              # Prettier format
pnpm run build               # Build for production
pnpm run start:prod          # Run production build
pnpm run start:debug         # Debug mode with inspector
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](LICENSE) for details.
