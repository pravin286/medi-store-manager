# Workspace

## Overview

Full-stack medical store directory and management platform with three user roles: Public (browse approved stores), Store Owner (submit/manage their stores), and Admin (review/approve/reject all stores).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Wouter routing, TailwindCSS, shadcn/ui)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (via jsonwebtoken + bcryptjs)
- **Maps**: Leaflet / react-leaflet
- **File Upload**: multer (local disk storage, served via /api/uploads/)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Seeded Test Accounts

- **Admin**: admin@medstore.com / admin123
- **Owner 1**: owner1@test.com / test1234 (Rahul Sharma)
- **Owner 2**: owner2@test.com / test1234 (Priya Patel)

## Application Features

### Public Home (/)
- Browse approved medical stores
- Search by store name/address
- Filter by minimum discount
- Click store to see full details + map

### Store Owner Panel (/owner/*)
- Signup / Login
- Dashboard showing owned stores with status badges
- Submit new store (with map location picker + image upload)
- Edit existing store details

### Admin Panel (/admin/*)
- Separate admin login
- Dashboard with stats: total/pending/approved/rejected/average discount
- Full store list with filter tabs (All/Pending/Approved/Rejected)
- Actions: Approve, Reject (with reason), Edit, Delete

## Architecture

- `artifacts/medical-stores/` — React/Vite frontend
- `artifacts/api-server/` — Express 5 backend
- `lib/db/` — Drizzle ORM schema (users + stores tables)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
