# Student Organization Management System – Phase 1

> Backend Foundation: Authentication, Users, and Role-Based Access Control

## Technology Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Runtime        | Node.js                  |
| Language       | JavaScript               |
| Framework      | Express.js               |
| ORM            | Prisma                   |
| Database       | Microsoft SQL Server     |
| Authentication | JWT (Bearer)             |
| Password Hash  | bcrypt                   |
| Validation     | Zod                      |
| API Docs       | Swagger / OpenAPI 3.0    |
| Testing        | Jest + Supertest         |

## Prerequisites

- **Node.js** ≥ 18
- **Microsoft SQL Server** (local or Docker)
- A database named `StudentOrganizationDb` (or update `DATABASE_URL`)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# → Update DATABASE_URL and JWT_SECRET

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed development data
npm run db:seed

# 6. Start the server
npm run dev
```

The server will start at `http://localhost:3000`.

## Available Scripts

| Script             | Description                       |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start dev server (with --watch)   |
| `npm start`        | Start production server           |
| `npm test`         | Run all tests                     |
| `npm run db:migrate` | Run Prisma migrations (dev)     |
| `npm run db:seed`  | Seed development data             |
| `npm run db:studio`| Open Prisma Studio                |

## API Endpoints

### Health Check

| Method | Route     | Access | Description          |
| ------ | --------- | ------ | -------------------- |
| GET    | `/health` | Public | API + DB health      |

### Authentication (`/api/v1/auth`)

| Method | Route       | Access        | Description              |
| ------ | ----------- | ------------- | ------------------------ |
| POST   | `/register` | Public        | Register new student     |
| POST   | `/login`    | Public        | Login, receive JWT       |
| GET    | `/me`       | Authenticated | Get current user profile |

### User Management (`/api/v1/users`) – ADMIN only

| Method | Route                   | Description          |
| ------ | ----------------------- | -------------------- |
| GET    | `/`                     | List users (paginated, searchable) |
| GET    | `/:userId`              | Get user details     |
| PATCH  | `/:userId/role`         | Change user role     |
| PATCH  | `/:userId/activate`     | Activate account     |
| PATCH  | `/:userId/deactivate`   | Deactivate account   |

### Interactive API Documentation

Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Seed Credentials (Development Only)

| Role           | Email                 | Password     |
| -------------- | --------------------- | ------------ |
| ADMIN          | admin@example.local   | Admin@123    |
| STUDENT_LEADER | leader@example.local  | Leader@123   |
| STUDENT        | student@example.local | Student@123  |

## Project Structure

```
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.js               # Development seed data
├── src/
│   ├── app.js                # Express application setup
│   ├── server.js             # Server entry point
│   ├── config/               # Environment + Swagger config
│   ├── controllers/          # HTTP request handlers
│   ├── middleware/            # Auth, RBAC, validation, errors, logging
│   ├── routes/               # Route definitions with Swagger JSDoc
│   ├── services/             # Business logic
│   ├── repositories/         # Prisma data access
│   ├── schemas/              # Zod validation schemas
│   ├── types/                # Shared constants
│   ├── utils/                # ApiError, response helpers, trace IDs
│   └── lib/                  # Prisma client singleton
├── tests/                    # Jest + Supertest integration tests
├── .env.example
├── package.json
└── README.md
```

## Architecture

```
Client → Express → Controller → Service → Repository → Prisma → SQL Server
```

- **Controllers** handle HTTP concerns only
- **Services** contain business logic
- **Repositories** handle all Prisma / database queries
- **Middleware** handles authentication, authorization, validation, errors, and logging

## Roles

| Role           | Capabilities                        |
| -------------- | ----------------------------------- |
| ADMIN          | Full user management, role changes  |
| STUDENT_LEADER | Authenticated access (future scope) |
| STUDENT        | Authenticated access (future scope) |

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email format" }],
  "traceId": "uuid-v4"
}
```

## License

ISC
