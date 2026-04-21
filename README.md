# Training App API

Backend API for a training application built with NestJS, Prisma, and PostgreSQL.

## Features

- JWT and Google OAuth authentication
- `Course` management
- `Course` publishing into `Catalog`
- `Catalog` version history on republish
- In-memory cache for catalog listing endpoint
- Event store and snapshot support for the `Course` aggregate
- Request validation with `class-validator`
- Docker and Docker Compose support for local development

## Tech Stack

- NestJS
- Prisma
- PostgreSQL
- Jest
- Docker

## Requirements

- Node.js 22+
- pnpm
- PostgreSQL

## Environment Variables

Create a `.env` file with at least the following values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/training-db"
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

## Run Locally

1. Install dependencies:

```bash
pnpm install
```

2. Generate the Prisma client:

```bash
pnpm prisma generate
```

3. Run database migrations:

```bash
pnpm prisma migrate deploy
```

4. Start the application:

```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000`.

Swagger documentation is available at `http://localhost:3000/api`.

## Run with Docker

Start the full stack with:

```bash
docker compose up --build
```

This starts:

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

When the app container starts, the entrypoint script runs:

```bash
pnpm prisma migrate deploy
```

and then starts the app with:

```bash
node dist/main
```

To stop the services:

```bash
docker compose down
```

To stop the services and remove the database volume:

```bash
docker compose down -v
```

## Available Scripts

```bash
pnpm build
pnpm start
pnpm start:dev
pnpm start:prod
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e
```

## Testing

Run all unit tests:

```bash
pnpm test
```

## Domain Overview

### Course

- A `Course` is created in draft status
- A `Course` can be updated
- A `Course` cannot be published if `title` or `content` is empty

### Catalog

- Publishing copies `Course` data into `Catalog`
- Republishing creates a new catalog version
- The previous active version is marked as deprecated
- The catalog list endpoint uses in-memory caching

## Important Paths

- `src/modules/course`: course and catalog module
- `src/modules/auth`: authentication module
- `src/common/event-store`: event store and snapshot services
- `prisma/schema.prisma`: database schema
- `docker-compose.yml`: local environment orchestration
- `Dockerfile`: API container image

## Notes

- If your editor does not recognize Jest globals such as `describe`, restart the TypeScript server after config changes.
- Make sure `DATABASE_URL` is correct if you run the app outside Docker.
