# Stemory Blooms Architecture

Based on the Product Requirements Document (PRD), this repository uses a monorepo approach with the following structure:

## Apps
- `apps/web`: Next.js frontend (App Router, TypeScript) for both the customer storefront and the internal admin dashboard.
- `apps/api`: NestJS API built on Fastify, handling core business logic, order workflows, and database access.

## Shared Packages
- `packages/database`: Prisma ORM schema, migrations, and generated client for PostgreSQL.
- `packages/contracts`: Shared Zod validation schemas and API types.
- `packages/ui`: Shared UI components and Vanilla CSS styling.
- `packages/security`: Authentication helpers and authorization guards using Clerk.
- `packages/config`: Shared TypeScript, linting, and testing configurations.

## Infrastructure
- `infrastructure/`: Local development setup using Docker Compose.

## Docs
- `docs/`: Architecture documentation, API design, threat model, and runbooks.
