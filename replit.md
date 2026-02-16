# StaffHub - Event Staffing Platform

## Overview
StaffHub is a comprehensive online staffing services platform for event-based workforce scheduling. It includes admin and staff portals with three core scheduling workflows (AutoConfirm, SeekReply, Publishing), time tracking, messaging, performance reviews, and profile management.

## Recent Changes
- **Feb 2026**: Initial build - Full-stack platform with auth, database, real-time messaging, and all core features

## Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Wouter routing, TanStack Query
- **Backend**: Express.js, WebSocket (ws)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)

## Project Architecture

### Structure
```
client/src/
  pages/           - Landing, AdminDashboard, StaffDashboard, StaffList, Messages, Reviews, Settings
  components/      - EventCard, ShiftCard, StaffListItem, TimeTracker, MessageThread, ReviewCard, AppSidebar
  hooks/           - use-auth, use-websocket, use-toast
  lib/             - queryClient (API fetching + mutations)
server/
  routes.ts        - All API endpoints + WebSocket server
  storage.ts       - DatabaseStorage with IStorage interface
  db.ts            - Drizzle + pg pool connection
  replit_integrations/auth/ - Replit Auth OIDC setup
shared/
  schema.ts        - Drizzle tables, insert schemas, types
  models/auth.ts   - Users + sessions tables from auth integration
```

### Database Tables
- users, sessions (from auth)
- staff_profiles (extends users with role, preferences)
- events (title, venue, date, times, status)
- shifts (links to events, assignment type: autoconfirm/seekreply/publishing)
- time_entries (clock in/out tracking)
- availability (ready pool dates)
- messages (sender/recipient direct messages)
- reviews (ratings and comments per shift)

### API Endpoints
- Auth: `/api/login`, `/api/logout`, `/api/auth/user`
- Profile: GET/PUT `/api/profile`
- Staff: GET `/api/staff`
- Events: GET/POST `/api/events`, GET/PATCH/DELETE `/api/events/:id`
- Shifts: GET `/api/events/:eventId/shifts`, GET `/api/shifts/my`, GET `/api/shifts/available`, POST `/api/shifts`, PATCH `/api/shifts/:id/respond`
- Time: GET `/api/time/active`, GET `/api/time/history`, POST `/api/time/clock-in`, POST `/api/time/clock-out`
- Messages: GET `/api/messages/conversations`, GET `/api/messages/:partnerId`, POST `/api/messages`
- Reviews: GET `/api/reviews/my`, POST `/api/reviews`

### WebSocket
- Path: `/ws`
- Auth: Send `{ type: "auth", userId }` after connect
- Events: `new_message` broadcasts to both sender and recipient

## User Preferences
- Role-based access: admin vs staff portals
- Staff profiles store: assignment preference, ready pool, auto-accept, availability visibility
- Three scheduling workflows: AutoConfirm, SeekReply, Publishing

## Running
- `npm run dev` starts the Express + Vite dev server on port 5000
- `npm run db:push` syncs Drizzle schema to PostgreSQL
