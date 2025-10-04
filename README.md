# Digital Dossier

Digital Dossier is a modern, full-stack content management platform designed for organizing and sharing digital content including blogs, books, and products. Built with Next.js and PostgreSQL, it provides a seamless experience for content creators and readers with features like real-time voting, threaded comments, and PDF integration.

## Features

- **Multi-Content Support**: Manage blogs, books, and products in a unified interface
- **PDF Integration**: Upload, store, and view PDF documents with a full-screen viewer
- **Real-time Engagement**: Voting system with optimistic updates and threaded comments
- **Search & Filtering**: Advanced search functionality with category-based filtering
- **User Authentication**: Secure authentication system with session management
- **AWS S3 Integration**: Scalable file storage for images and PDFs
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **SEO Optimized**: Built-in SEO features with OpenGraph and Twitter Card support
- **Email Notifications**: MJML-based email templates with Nodemailer integration

## Architecture

Digital Dossier follows a modern web architecture pattern:

```
Frontend (Next.js 15) → API Routes → Prisma ORM → PostgreSQL
                     ↘ AWS S3 (File Storage)
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with optimized indexing
- **File Storage**: AWS S3 with CDN delivery
- **Authentication**: Custom JWT-based authentication
- **Email**: MJML templates with Nodemailer
- **Deployment**: Docker containerization

## Installation

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- AWS S3 bucket for file storage
- SMTP server for email functionality

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd books-dashboard
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

   The application will be available at `http://localhost:3003`

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Database setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blogdb

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# S3 Prefixes
S3_CONTENT_IMAGES_PREFIX=content-images
S3_CONTENT_PDFS_PREFIX=content-pdfs
S3_AVATARS_PREFIX=avatars

# Authentication
CREDENTIAL_INTERNAL_TOKEN=your_secure_token

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3003
SITE_URL=https://yourdomain.com

# Revalidation (for ISR)
REVALIDATION_TOKEN=your_revalidation_token
```

## API Endpoints

### Content Management
- `GET /api/blog` - List all blog posts
- `GET /api/blog/[slug]` - Get specific blog post
- `POST /api/upload` - Upload files to S3

### User Engagement
- `GET /api/votes/[contentType]/[contentId]` - Get vote status
- `POST /api/votes/[contentType]/[contentId]` - Cast vote
- `DELETE /api/votes/[contentType]/[contentId]` - Remove vote

### Comments System
- `GET /api/comments/[contentType]/[contentId]` - Get threaded comments
- `POST /api/comments/[contentType]/[contentId]` - Create comment

### Utility
- `POST /api/revalidate` - Trigger on-demand revalidation
- `GET /api/genres/stats` - Get genre usage statistics

## Database Schema

The application uses Prisma ORM with the following core models:

- **Content Models**: `Blog`, `Book`, `Product` with shared voting/comment aggregates
- **User Engagement**: `Vote`, `Comment` with polymorphic content relationships
- **Organization**: `Genre`, `Tag` with many-to-many relationships
- **Users**: `User`, `Profile` with authentication support

### Key Features

- **Polymorphic Relationships**: Votes and comments work across all content types
- **Aggregated Counters**: Real-time vote scores and comment counts
- **Threaded Comments**: Unlimited depth comment threading
- **Performance Indexes**: Optimized for common query patterns

## Development

### Project Structure

```
├── components/          # Reusable React components
├── contexts/           # React context providers
├── lib/               # Utility libraries and helpers
├── pages/             # Next.js pages and API routes
│   ├── api/          # Backend API endpoints
│   ├── blog/         # Blog-related pages
│   ├── books/        # Book-related pages
│   └── products/     # Product-related pages
├── prisma/           # Database schema and migrations
├── public/           # Static assets
├── styles/           # Global CSS and Tailwind config
└── migrations/       # Custom database migrations
```

### Key Components

- **VotingWidget**: Real-time voting with optimistic updates
- **CommentsSection**: Threaded comment system
- **FullScreenPDFViewer**: Integrated PDF viewing experience
- **GenreSelector**: Dynamic genre management with usage statistics
- **Layout**: Responsive navigation and search functionality

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Database administration GUI
```

## Testing

### Database Consistency

The application includes built-in database functions for monitoring and maintaining data integrity:

```sql
-- Check vote count consistency
SELECT * FROM check_vote_consistency();

-- Fix any inconsistencies
SELECT fix_all_vote_inconsistencies();
```

### Performance Monitoring

- Database triggers ensure vote/comment aggregates stay synchronized
- Optimistic UI updates provide immediate user feedback
- ISR (Incremental Static Regeneration) with 10-second revalidation
- Performance indexes on high-traffic query patterns

## Deployment

### Vercel Deployment (Recommended)

The application is optimized for Vercel deployment with the included `vercel.json` configuration:

```bash
# Deploy to Vercel
npm run build:vercel
```

**Environment Variables for Vercel:**
- Copy all variables from `.env.production` to your Vercel project dashboard
- Ensure `DATABASE_URL` points to your production PostgreSQL instance (Neon.tech recommended)
- Configure AWS S3 credentials for file storage
- Set `AUTH_API_BASE` to your authentication service endpoint

**Live Demo:** [https://digital-dossier-68rvndqsk-suvojit-duttas-projects.vercel.app](https://digital-dossier-68rvndqsk-suvojit-duttas-projects.vercel.app)

### Production Build

```bash
# Build the application
npm run build

# Generate sitemap
npm run postbuild

# Start production server
npm start
```

### Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# With custom environment
docker-compose --env-file .env.prod up -d
```

### Database Migrations

```bash
# Apply pending migrations
npx prisma migrate deploy

# Apply custom migrations
cat migrations/fix_voting_consistency.sql | psql $DATABASE_URL
```

## Future Development

Digital Dossier is actively evolving with several exciting features planned:

### Content Creation & Design
- **Canva Integration**: Direct integration with Canva for in-app content authoring and formatting
- **Rich Text Editor**: Advanced WYSIWYG editor with collaborative editing
- **Template System**: Pre-built content templates for consistent formatting

### Analytics & Insights
- **Google Analytics Integration**: Comprehensive traffic and engagement analytics
- **User Behavior Tracking**: Heat maps and user journey analysis
- **Content Performance Metrics**: Advanced analytics for content optimization

### Enhanced Features
- **Multi-language Support**: Internationalization with automatic translation
- **Advanced Search**: Elasticsearch integration with semantic search
- **Social Media Integration**: Auto-posting to social platforms
- **Mobile App**: React Native companion app
- **AI-Powered Features**: Content recommendations and auto-tagging

### Enterprise Features
- **Team Collaboration**: Multi-user editing and approval workflows
- **Advanced Permissions**: Role-based access control
- **White-label Solutions**: Customizable branding and themes
- **API Marketplace**: Third-party integrations and plugins

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for community support
- **Email**: Contact the development team at suvodutta.isme@gmail.com

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- Database powered by [PostgreSQL](https://postgresql.org/) and [Prisma](https://prisma.io/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons provided by [Lucide React](https://lucide.dev/)
- File storage by [AWS S3](https://aws.amazon.com/s3/)

---

**Digital Dossier** - Empowering content creators with modern web technology.
