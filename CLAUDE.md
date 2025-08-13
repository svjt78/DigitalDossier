# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Digital Dossier is a full-stack Next.js content management platform for organizing blogs, books, and products with real-time engagement features. Built with Next.js 15, React 19, PostgreSQL, Prisma ORM, and AWS S3 for file storage.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server on port 3003
npm run build        # Build for production
npm run postbuild    # Generate sitemap after build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npx prisma migrate dev      # Apply migrations in development
npx prisma migrate deploy   # Apply migrations in production
npx prisma generate        # Regenerate Prisma client
npx prisma studio          # Open database administration GUI
```

### Docker Operations
```bash
docker-compose up -d              # Start with PostgreSQL
docker-compose --env-file .env up # Custom environment
```

## Architecture & Key Concepts

### Content Model Architecture
The application uses a **polymorphic content system** where blogs, books, and products share common voting and commenting functionality:

- **Content Types**: `Blog`, `Book`, `Product` models with shared fields (`netScore`, `totalVotes`, `commentCount`)
- **Polymorphic Relations**: `Vote` and `Comment` models reference any content type via `contentType` + `contentId`
- **Real-time Aggregation**: Database triggers maintain vote/comment counts automatically
- **Optimistic Updates**: UI updates immediately with server sync in background

### Authentication System
- **Custom JWT Authentication**: Stored in localStorage with AuthContext
- **Role-based Access**: SuperUser functionality with `isSuperUser()` utility
- **Session Management**: Persistent across browser sessions

### File Storage Strategy
- **AWS S3 Integration**: Separate prefixes for different content types
  - `content-images/` - Blog/book cover images
  - `content-pdfs/` - PDF documents
  - `avatars/` - User profile pictures
- **Upload API**: `/api/upload` handles multipart form data with formidable

### Database Schema Highlights
- **Threaded Comments**: Self-referential `Comment` model with unlimited depth via `parentId`
- **Tag System**: Many-to-many relationships with separate junction tables (`BlogTag`, `BookTag`, `ProductTag`)
- **Performance Indexes**: Optimized for polymorphic queries and vote aggregations
- **Constraint Enforcement**: Unique votes per user per content item

## Key Components & Patterns

### VotingWidget Component (`components/VotingWidget.js`)
- **Optimistic Updates**: Immediate UI response with server reconciliation
- **Error Recovery**: Automatic retry and sync error detection
- **State Management**: Separate optimistic and server state tracking

### AuthContext (`contexts/AuthContext.js`)
- **LocalStorage Persistence**: Maintains authentication across sessions
- **Debug Logging**: Extensive console logging for troubleshooting
- **SuperUser Detection**: Dynamic role checking

### Layout System (`components/Layout.js`)
- **Responsive Design**: Mobile-first with collapsible sidebar
- **SEO Optimization**: JSON-LD schema markup and meta tags
- **Sticky Navigation**: Header and navbar remain fixed during scroll

## API Routes Structure

### Content APIs
- `GET /api/blog` - List blogs with pagination and filtering
- `POST /api/upload` - File upload to S3 (images/PDFs)
- `POST /api/revalidate` - Trigger ISR revalidation

### Engagement APIs
- `GET|POST|DELETE /api/votes/[contentType]/[contentId]` - Vote management
- `GET|POST /api/comments/[contentType]/[contentId]` - Comment system
- `PUT|DELETE /api/comments/[commentId]` - Comment updates

### User Management
- `POST /api/auth/login` - User authentication
- `POST /api/auth/signup` - User registration
- `POST /api/users/delete-batch` - Batch user operations

## Environment Configuration

### Required Variables
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
CREDENTIAL_INTERNAL_TOKEN=secure_token
EMAIL_USER=smtp_user
EMAIL_PASS=smtp_password
NEXT_PUBLIC_BASE_URL=http://localhost:3003
```

## Development Guidelines

### Database Migrations
- Custom SQL migrations in `/migrations/` directory
- Apply via: `cat migrations/filename.sql | psql $DATABASE_URL`
- Vote consistency functions: `check_vote_consistency()`, `fix_all_vote_inconsistencies()`

### File Upload Handling
- Use `formidable` for multipart parsing in API routes
- All uploads go through `/api/upload` with S3 key generation
- PDF viewer integration via `FullScreenPDFViewer` component

### Error Handling Patterns
- Optimistic UI updates with rollback on failure
- Comprehensive error logging and user feedback
- Network error recovery with automatic retry

### Testing Approach
- Use Prisma Studio for database inspection
- Check vote consistency with built-in SQL functions
- Test file upload with different content types

## Email System
- **MJML Templates**: Located in `/emails/` directory
- **Nodemailer Integration**: SMTP configuration required
- **Template Types**: Signup confirmation, password reset, comment alerts

## Performance Considerations
- **ISR (Incremental Static Regeneration)**: 10-second revalidation for content pages
- **Database Indexes**: Optimized for polymorphic queries and aggregations
- **Optimistic Updates**: Reduce perceived latency for user interactions
- **Connection Pooling**: Prisma handles PostgreSQL connections efficiently