# RankYak SEO Platform

A comprehensive SEO content management platform built with Next.js 16, TypeScript, Prisma, and Better Auth.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## Features

- ✅ **Project Management** - Create and manage multiple SEO projects
- ✅ **Keyword Research & Planning** - AI-powered keyword research and content planning
- ✅ **Article Generation** - Automated SEO-optimized article generation
- ✅ **Content Calendar** - Visual calendar for content scheduling
- ✅ **Backlink Tracking** - Monitor and manage backlinks
- ✅ **Analytics Dashboard** - Real-time SEO analytics and insights
- ✅ **WordPress Integration** - Auto-publish articles to WordPress sites
- ✅ **Google OAuth** - Secure authentication with Google
- ✅ **Onboarding Flow** - AI-powered website analysis and setup

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma)
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **AI Services**: OpenAI API

## Documentation

📚 **All documentation is available in the [`docs/`](./docs/) folder:**

- [Setup Guide](./docs/SETUP.md) - Complete setup instructions
- [Database Setup](./docs/DATABASE_SETUP.md) - Database configuration
- [Quick Start](./docs/QUICK_START.md) - Get started quickly
- [Google OAuth Setup](./docs/GOOGLE_SETUP.md) - Google authentication setup
- [Features Implementation Plan](./docs/FEATURES_IMPLEMENTATION_PLAN.md) - Feature roadmap
- [GitHub Setup](./docs/.github-setup.md) - GitHub repository setup

## Available Scripts

- `npm run dev` - Start development server (port 4000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/        # Dashboard pages
│   └── onboarding/       # Onboarding flow
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/               # Database schema
├── docs/                 # Documentation
└── public/               # Static assets
```

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

