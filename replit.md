# BOLT - File Sharing Application

## Overview

BOLT is a fast and secure file sharing application that allows users to upload files up to 200MB and share them via secure links. The application is built with a modern full-stack architecture using React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence. The application emphasizes simplicity with no registration requirements and automatic file expiration for security.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)

### Migration to Replit Environment (August 2025)
- ✅ Migrated from Replit Agent to standard Replit environment
- ✅ Converted to Supabase-only storage (removed in-memory storage)
- ✅ Added session management with express-session middleware
- ✅ Fixed all authentication routes for Supabase integration
- ✅ Professional homepage redesign with grid layout
- ✅ Split-screen layout: brand/features left, upload/download right
- ✅ No-scroll design - all key features visible immediately
- ✅ Grid background pattern and glassmorphism effects
- ✅ Enhanced visual hierarchy and spacing
- ✅ Optimized content positioning - moved heading section upwards for better visibility

### File Sharing Implementation
- ✅ Complete file upload/download system working
- ✅ Local storage in `/uploads/` directory 
- ✅ 6-character sharing codes (e.g., "I9K7GD")
- ✅ 24-hour auto-expiration
- ✅ Download code input on homepage
- ✅ Mobile-responsive hamburger menu
- ✅ Dark/light theme toggle

### User Authentication System (August 2025)
- ✅ Supabase database integration for user management
- ✅ Username/password authentication (no email required)
- ✅ Secure password hashing with bcrypt
- ✅ Login/signup modal with smooth animations
- ✅ Auth warning for anonymous users about file persistence
- ✅ File ownership - logged-in users can track their files
- ✅ Anonymous file uploads still supported
- ✅ User dropdown menu in navigation
- ✅ Authentication state management with React Context

## System Architecture

### Frontend Architecture
The client is built using React 18 with TypeScript and follows a component-based architecture:

- **UI Framework**: Uses shadcn/ui components built on top of Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming support (light/dark mode)
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation resolvers

### Backend Architecture
The server follows a REST API pattern built with Express.js:

- **Runtime**: Node.js with ES modules
- **Web Framework**: Express.js with middleware for JSON parsing, logging, and error handling
- **File Upload**: Multer for handling multipart/form-data file uploads with 200MB size limit
- **Storage Strategy**: In-memory storage implementation for development with file system persistence
- **API Design**: RESTful endpoints for file upload, retrieval, and download operations

### Data Storage Solutions
**Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Single `files` table with metadata including filename, MIME type, size, unique codes, and expiration timestamps
- **Migration System**: Drizzle Kit for schema migrations and database management
- **File Storage**: Local file system storage in `uploads` directory with UUID-based filenames

### Authentication and Authorization
The application uses a code-based access system:
- **No User Authentication**: Files are accessed via randomly generated 6-character alphanumeric codes
- **Security Model**: Files automatically expire after 24 hours
- **Access Control**: File access is granted through knowledge of the unique sharing code

### Key Design Patterns
**Storage Abstraction**: IStorage interface allows switching between in-memory and database storage implementations
- **Error Handling**: Centralized error handling middleware with consistent JSON error responses
- **Logging**: Request/response logging with duration tracking for API endpoints
- **File Cleanup**: Automatic cleanup process for expired files to prevent storage bloat
- **Progressive Enhancement**: Upload progress indication and optimistic UI updates

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon database connectivity
- **drizzle-orm**: Type-safe ORM for PostgreSQL with TypeScript integration
- **express**: Web application framework for Node.js backend
- **multer**: File upload middleware for handling multipart forms

### Frontend UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives (accordion, dialog, dropdown, etc.)
- **@tanstack/react-query**: Data fetching and caching library for React
- **wouter**: Minimalist routing library for React applications
- **react-dropzone**: File drag-and-drop functionality for upload interface

### Development and Build Tools
- **vite**: Frontend build tool with HMR and optimized production builds
- **tailwindcss**: Utility-first CSS framework for styling
- **typescript**: Static type checking for JavaScript
- **drizzle-kit**: Database migration and introspection tool

### Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **zod**: TypeScript-first schema validation library
- **clsx**: Utility for constructing className strings conditionally
- **nanoid**: URL-safe unique string ID generator