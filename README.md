# RankYak SEO Platform

A comprehensive SEO content management platform built with Next.js 16, TypeScript, Prisma, and Better Auth.

## Features

### Core Features
- ✅ **Project Management** - Create and manage multiple SEO projects
- ✅ **Keyword Research & Planning** - AI-powered keyword research and content planning
- ✅ **Article Generation** - Automated SEO-optimized article generation
- ✅ **Content Calendar** - Visual calendar for content scheduling
- ✅ **Backlink Tracking** - Monitor and manage backlinks
- ✅ **Analytics Dashboard** - Real-time SEO analytics and insights
- ✅ **WordPress Integration** - Auto-publish articles to WordPress sites
- ✅ **Google OAuth** - Secure authentication with Google
- ✅ **Onboarding Flow** - AI-powered website analysis and setup

### Technical Features
- ✅ **Better Auth** - Modern authentication with email/password and OAuth
- ✅ **Prisma ORM** - Type-safe database access
- ✅ **React Query** - Efficient data fetching and caching
- ✅ **Toast Notifications** - User-friendly error and success messages
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Modern, responsive UI
- ✅ **Next.js 15** - Latest Next.js features with App Router

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma)
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: Custom components with Framer Motion
- **AI Services**: OpenAI API
- **Job Queue**: BullMQ with Redis

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis (for job queue)
- OpenAI API key
- Google OAuth credentials (optional, for Google sign-in)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd seo-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/seo_app"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:4000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-api-key"
REDIS_URL="redis://localhost:6379"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── onboarding/       # Onboarding flow
│   └── ...
├── components/            # React components
│   └── dashboard/        # Dashboard-specific components
├── lib/                   # Utility libraries
│   ├── api/              # API utilities
│   ├── integrations/     # Third-party integrations
│   ├── jobs/             # Background jobs
│   ├── services/         # Business logic services
│   └── utils/            # Helper utilities
├── prisma/               # Database schema
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server (port 4000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The application uses Prisma with PostgreSQL. Key models include:
- `User` - User accounts
- `Project` - SEO projects
- `Keyword` - Keywords to target
- `Article` - Generated articles
- `Backlink` - Backlink tracking
- `Integration` - Third-party integrations

## Authentication

The app uses Better Auth for authentication with support for:
- Email/password authentication
- Google OAuth
- Session management

## API Routes

All API routes are in `app/api/`:
- `/api/projects` - Project management
- `/api/keywords` - Keyword operations
- `/api/articles` - Article management
- `/api/backlinks` - Backlink tracking
- `/api/integrations` - Integration management
- `/api/analytics` - Analytics data
- `/api/auth/*` - Authentication endpoints

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.
