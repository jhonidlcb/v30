# SoftwarePar - Full-Stack Software Development Platform

## Overview

SoftwarePar is a comprehensive software development platform tailored for the Argentine market, specializing in custom software development services. It offers a complete business solution for managing software projects, from client interaction and development to multi-stage payment processing via MercadoPago and continuous support. Key features include client management, a partner referral program, project management with progress tracking, support ticketing, and WhatsApp notifications. The platform supports three distinct user roles: administrators, partners, and clients. The business vision is to streamline software project delivery and management, leveraging robust financial and communication tools for enhanced efficiency and client satisfaction in the local market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend leverages React 18 with TypeScript, using shadcn/ui components, Radix UI primitives, and Tailwind CSS for a modern, responsive design. Wouter handles client-side routing, and Framer Motion provides smooth animations. The architecture emphasizes a modular component structure and real-time user feedback via WebSockets.

### Technical Implementations
The frontend uses TanStack Query for server state management. The backend is built with Express.js and TypeScript, adhering to a RESTful API design. It implements JWT-based authentication with role-based access control (RBAC) and bcryptjs for password hashing. API routes are organized by feature domains, incorporating middleware for authentication, authorization, and validation using Zod schemas. WebSockets are integrated for real-time notifications.

### Feature Specifications
- **Project Management**: Includes project creation, status tracking (pending, negotiating, in_progress, completed, cancelled), progress updates (0-100%), and dynamic currency handling (PYG/USD).
- **Payment System**: Multi-stage payment processing integrated with MercadoPago. It supports automatic payment link generation, webhook handling for status updates, commission calculation for partners, and a manual payment verification process for local methods where clients upload proof of payment for admin approval.
- **Communication**: Email (Gmail SMTP), WhatsApp (Twilio API), and real-time WebSocket notifications for critical updates and system alerts.
- **Partner Program**: A referral system with unique referral codes, configurable commission rates (25% default), and tracking of earnings and conversions.
- **Budget Negotiation**: A structured negotiation flow allowing admins and clients to propose, accept, reject, or counter project price proposals.
- **Invoicing**: Automatic generation of legal Paraguayan RESIMPLE invoices (boleta RESIMPLE) for approved payment stages, including unique invoice numbering, fixed exchange rates, and PDF generation with client and company billing details.
- **Electronic Invoicing (SIFEN)**: Comprehensive implementation for Paraguay's SIFEN system (v150 standard). This includes generating SIFEN-compliant XML, digital signing with PFX certificates (RSA-SHA256 XAdES), sending invoices to SIFEN via SOAP Web Services, generating QR codes for public validation, and storing CDC, XML, and authorization protocols. It operates independently of third-party SIFEN services, supporting both test and production environments with or without a PFX certificate.
- **FacturaSend Integration**: Alternative electronic invoicing via FacturaSend.com.py API. Automatically sends invoices to FacturaSend upon payment approval, with dynamic geographic catalog fetching for accurate SIFEN codes. **STATUS: ✅ CONFIGURED, TESTED AND WORKING** - API Key configured in Replit Secrets. Authentication uses `Authorization: Bearer api_key_<API_KEY>` format. Base URL: https://api.facturasend.com.py/jhonifabianbenitezdelacruz. Successfully tested with invoice generation (CDC: 01042200580001001000000112025101410437431888). Correct item format: ivaTipo=1, ivaBase=100, iva=10 for 10% IVA. Date format: ISO without milliseconds. Test endpoints: GET /api/test-facturasend (admin only)

### System Design Choices
PostgreSQL is the primary database, accessed via Drizzle ORM for type-safe operations. The database schema includes tables for users, partners, projects, payment stages, tickets, notifications, and more. Database migrations are managed with Drizzle Kit, and Neon's serverless PostgreSQL driver is used for connections. Authentication relies on JWT tokens stored in localStorage, enforcing RBAC across admin, partner, and client roles.

## External Dependencies

-   **Database**: PostgreSQL (via Neon serverless)
-   **ORM**: Drizzle ORM
-   **Payment Gateway**: MercadoPago
-   **Email Service**: Gmail SMTP
-   **SMS/Messaging API**: Twilio (for WhatsApp)
-   **Frontend Framework**: React
-   **Build Tool**: Vite
-   **UI Library**: shadcn/ui, Radix UI
-   **Styling**: Tailwind CSS
-   **State Management**: TanStack Query
-   **Animations**: Framer Motion
-   **Routing**: Wouter
-   **Backend Framework**: Express.js
-   **Validation**: Zod
-   **Authentication**: JWT, bcryptjs

## Replit Setup

### Environment Configuration
The project is configured to run in the Replit environment with the following setup:

- **Development Server**: Runs on port 5000 (frontend with Vite HMR)
- **Backend API**: Proxied through Vite dev server (configured in vite.config.ts)
- **Database**: PostgreSQL (Neon) - Schema managed with Drizzle ORM
- **Workflow**: `npm run dev` - Starts the development server with TypeScript execution via tsx

### Important Setup Steps
1. **Database Schema**: Run `npm run db:push` (or `npm run db:push --force` for schema updates with data changes) to sync the database schema
2. **Environment Variables**: Required variables are DATABASE_URL (auto-configured), GMAIL_USER, and GMAIL_PASS
3. **Optional Variables**: JWT_SECRET, MercadoPago credentials, Twilio credentials, FacturaSend API key
4. **Vite Configuration**: The dev server is configured with `allowedHosts: true` to work with Replit's proxy system

### Deployment Configuration
- **Target**: Autoscale (stateless web application)
- **Build Command**: `npm run build` (builds both frontend and backend)
- **Run Command**: `npm start` (runs production server)
- **Port**: 5000 (required by Replit)

### WebSocket Real-Time Updates System

The platform uses WebSocket connections for real-time updates across all user roles. The system implements two types of WebSocket events:

1. **Notification Events** (`type: 'notification'`): UI notifications displayed to users (toast messages, bell notifications)
2. **Data Update Events** (`type: 'data_update'`): Trigger automatic cache invalidation in frontend queries for real-time data refresh

**Critical Implementation Details**:
- All data mutations (project creation, ticket updates, payment approvals, etc.) **MUST** emit corresponding `data_update` events
- The backend broadcasts events via `broadcastRealtimeEvent(userIds, eventType, eventData)`
- The frontend handles events in `useWebSocket.ts` with automatic TanStack Query cache invalidation
- Each WebSocket connection is authenticated with userId and stored in a Map for targeted event delivery

**Available Data Update Events**:
- `project_created`: Invalidates `/api/projects` and `/api/admin/projects`
- `project_updated`: Invalidates project queries
- `budget_negotiation`: Invalidates budget queries
- `ticket_created`, `ticket_updated`: Invalidates ticket queries and responses
- `payment_proof_uploaded`, `payment_approved`, `payment_rejected`: Invalidates payment and billing queries
- `message_created`: Invalidates project messages
- `file_uploaded`: Invalidates project files
- `invoice_generated`: Invalidates invoice queries
- `analytics_updated`: Invalidates admin analytics

**Connection Details**:
- Protocol: WebSocket (ws:// for development, wss:// for production)
- Endpoint: `/ws` on the same server
- Heartbeat: Ping/pong every 30 seconds
- Auto-reconnect: Exponential backoff (max 5 attempts)

### Database Information

**Connection Details**:
- Database: PostgreSQL (Neon serverless)
- Host: `ep-red-shape-ac6qnrhr-pooler.sa-east-1.aws.neon.tech`
- Region: South America (sa-east-1)
- Pool Mode: Enabled (for serverless connection management)

**Schema Management**:
- ORM: Drizzle ORM with TypeScript
- Schema File: `shared/schema.ts` (defines all tables and relations)
- Storage Logic: `server/storage.ts` (database operations and queries)
- Migration Command: `npm run db:push` (or `npm run db:push --force` for data-loss warnings)
- **NEVER** manually write SQL migrations - always use Drizzle push commands

**Key Tables**:
- `users`: User accounts (admin, partner, client roles)
- `partners`: Partner referral program data
- `projects`: Client projects with status tracking
- `payment_stages`: Multi-stage payment system
- `tickets`: Support ticket system
- `notifications`: In-app notifications
- `invoices`: SIFEN electronic invoicing records
- Additional tables: work_modalities, portfolio, project_messages, project_files, etc.

### Recent Changes

**Fresh GitHub Import Setup** (October 17, 2025):
- ✅ Cloned project from GitHub repository
- ✅ Installed all npm dependencies (686 packages)
- ✅ Created .gitignore for Node.js project with proper exclusions
- ✅ Database schema already synced with PostgreSQL (no changes needed)
- ✅ Configured workflow for development server (npm run dev on port 5000)
- ✅ Set up deployment configuration for autoscale deployment
- ✅ Verified application is running successfully with Vite HMR
- ✅ Confirmed environment variables are configured: DATABASE_URL, GMAIL_USER, GMAIL_PASS
- ✅ Frontend displaying correctly with all features working
- ✅ WebSocket server ready and operational

**Real-Time Updates Fix** (October 16, 2025):
- ✅ **FIXED**: Admin panels now update automatically when clients create projects, tickets, or other entities
- ✅ Added `project_created` data_update event emission in `notifyProjectCreated()` function
- ✅ Added `budget_negotiation` data_update event emission in `notifyBudgetNegotiation()` function
- ✅ Updated frontend WebSocket handler to invalidate project queries on `project_created` event
- ✅ Fixed TypeScript error in error handling (notifications.ts line 248)
- **Root Cause**: Notification functions were only sending UI notifications without emitting data_update events for cache invalidation
- **Solution**: Added `broadcastRealtimeEvent()` calls with appropriate event types to trigger frontend query invalidation