# RankYak Features Implementation Plan

## Business Model Analysis

**RankYak Core Value Proposition:**
- Fully automated SEO platform that handles keyword research, content creation, and backlink building
- Generates 1 SEO-optimized article per day automatically
- Publishes directly to websites via integrations (WordPress, Shopify, Webflow, etc.)
- Automated backlink exchange network
- Multi-site management for agencies
- 40+ language support
- Google Search Console integration for data-driven SEO

**Current Implementation Status:**
- ✅ Marketing website (complete frontend)
- ✅ Dashboard UI structure (all pages created)
- ✅ Navigation and routing
- ✅ Design system and animations
- ❌ Backend/API integration
- ❌ Authentication system
- ❌ Real data functionality
- ❌ Core business logic

## Technology Stack

**Backend:**
- **tRPC** - Type-safe API layer with end-to-end types
- **Prisma** - Type-safe ORM for database operations
- **Neon DB** - Serverless PostgreSQL database
- **Better Auth** - Modern authentication solution
- **Polar Payments** - Payment processing and subscriptions

**External Services:**
- OpenAI API (article generation)
- Ahrefs/SEMrush API (keyword research)
- Google Search Console API
- Integration APIs (WordPress, Shopify, Webflow, etc.)

**Background Jobs:**
- BullMQ or similar for job queues
- Cron jobs for scheduled tasks

**State Management:**
- React Query with tRPC hooks
- Zustand or Context API for client state

## Implementation Phases

### Phase 1: Foundation & Setup (Priority: Critical)

**1.1 Project Setup**
- Install and configure tRPC
- Set up Prisma with Neon DB connection
- Configure Better Auth
- Set up Polar Payments
- Environment variables configuration

**Files to create:**
- `package.json` (update dependencies)
- `.env.example`
- `prisma/schema.prisma`
- `prisma/migrations/`
- `server/trpc/trpc.ts`
- `server/trpc/context.ts`
- `server/trpc/router.ts`
- `lib/auth.ts` (Better Auth config)
- `lib/polar.ts` (Polar Payments config)

**Dependencies to install:**
```json
{
  "@trpc/server": "^10.x",
  "@trpc/client": "^10.x",
  "@trpc/react-query": "^10.x",
  "@trpc/next": "^10.x",
  "@prisma/client": "^5.x",
  "prisma": "^5.x",
  "better-auth": "^latest",
  "@polar-sh/sdk": "^latest",
  "@tanstack/react-query": "^5.x"
}
```

**1.2 Database Schema (Prisma)**
```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  projects      Project[]
  subscriptions Subscription[]
}

model Project {
  id              String    @id @default(cuid())
  userId          String
  name            String
  websiteUrl      String
  language        String    @default("en")
  brandVoice      Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id])
  keywords        Keyword[]
  articles        Article[]
  backlinks       Backlink[]
  integrations    Integration[]
  settings        ProjectSettings?
}

model Keyword {
  id              String    @id @default(cuid())
  projectId       String
  keyword         String
  searchVolume    Int?
  difficulty      Int?
  plannedDate     DateTime?
  status          String    @default("unplanned") // unplanned, planned, used
  starred         Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
  articles        Article[]
}

model Article {
  id              String    @id @default(cuid())
  projectId       String
  keywordId       String?
  title           String
  content         String
  metaTitle       String?
  metaDescription String?
  status          String    @default("draft") // draft, scheduled, published
  publishedAt     DateTime?
  seoScore        Int?
  wordCount       Int?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
  keyword         Keyword?  @relation(fields: [keywordId], references: [id])
}

model Backlink {
  id              String    @id @default(cuid())
  projectId     String
  fromUrl         String
  toUrl           String
  anchorText      String?
  status          String    @default("pending") // pending, published, rejected
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
}

model Integration {
  id              String    @id @default(cuid())
  projectId       String
  platform        String    // wordpress, shopify, webflow, etc.
  credentials     Json      // encrypted credentials
  isActive        Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
}

model Subscription {
  id              String    @id @default(cuid())
  userId          String
  polarCustomerId String?
  plan            String    // pro, agency
  status          String    // active, cancelled, expired
  currentPeriodEnd DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id])
}
```

**1.3 Better Auth Configuration**
- Google OAuth setup
- Email/password authentication
- Session management
- Protected route middleware

**Files to create:**
- `lib/auth.ts`
- `app/api/auth/[...all]/route.ts`
- `middleware.ts`

**1.4 tRPC Setup**
- Create tRPC router structure
- Set up React Query integration
- Create tRPC client hooks
- Error handling

**Files to create:**
- `server/trpc/trpc.ts`
- `server/trpc/context.ts`
- `server/trpc/router/_app.ts`
- `server/trpc/router/index.ts`
- `app/api/trpc/[trpc]/route.ts`
- `lib/trpc/client.ts`
- `lib/trpc/server.ts`

### Phase 2: Authentication & User Management (Priority: Critical)

**2.1 Better Auth Implementation**
- Google OAuth flow
- Email/password registration
- Login/logout functionality
- Session management
- Protected dashboard routes

**tRPC Routers to create:**
- `server/trpc/routers/auth.ts`
- `server/trpc/routers/user.ts`

**Files to modify:**
- `app/login/page.tsx` (connect to Better Auth)
- `app/register/page.tsx`
- `components/Header.tsx` (auth state)
- `middleware.ts` (route protection)

**2.2 User Profile Management**
- Profile update
- Avatar upload
- Account settings

**tRPC Router:**
- `server/trpc/routers/user.ts` (update profile procedures)

### Phase 3: Project Management (Priority: High)

**3.1 Project CRUD Operations**
- Create project
- List user projects
- Update project settings
- Delete project
- Switch between projects

**tRPC Router:**
- `server/trpc/routers/project.ts`
  - `create`
  - `list`
  - `getById`
  - `update`
  - `delete`
  - `switch`

**Files to modify:**
- `app/dashboard/settings/project/page.tsx`
- `components/dashboard/ProjectSwitcher.tsx`

### Phase 4: Keyword Management (Priority: High)

**4.1 Keyword Discovery**
- Integrate keyword research API
- Automatic keyword discovery
- Search volume and difficulty fetching
- Opportunity analysis

**tRPC Router:**
- `server/trpc/routers/keyword.ts`
  - `discover`
  - `analyze`
  - `add`
  - `bulkAdd`
  - `list`
  - `update`
  - `delete`
  - `star`
  - `plan`

**External Service Integration:**
- `lib/services/keyword-research.ts` (Ahrefs/SEMrush API)

**Files to modify:**
- `app/dashboard/keywords/page.tsx`
- `components/dashboard/KeywordTable.tsx`
- `components/dashboard/AddKeywordModal.tsx`

**4.2 Keyword Clustering**
- Topic cluster generation
- Related keyword grouping
- Cluster-based content planning

**tRPC Router:**
- `server/trpc/routers/keyword.ts`
  - `cluster`
  - `getClusters`

### Phase 5: Content Planning & Calendar (Priority: High)

**5.1 Automated Content Planning**
- Daily keyword selection algorithm
- Content calendar generation
- Scheduling logic
- Priority-based selection

**tRPC Router:**
- `server/trpc/routers/calendar.ts`
  - `generate`
  - `getMonth`
  - `schedule`
  - `reschedule`
  - `getDay`

**Files to modify:**
- `app/dashboard/calendar/page.tsx`
- `components/dashboard/CalendarGrid.tsx`

**5.2 Calendar Management**
- Drag-and-drop rescheduling
- Manual adjustments
- View filters
- Export functionality

**tRPC Router:**
- `server/trpc/routers/calendar.ts`
  - `update`
  - `export`

### Phase 6: Article Generation & Editor (Priority: Critical)

**6.1 Article Generation Engine**
- AI content generation (OpenAI)
- SEO optimization
- Competitor analysis
- SERP analysis
- E-E-A-T compliance
- Internal linking suggestions

**tRPC Router:**
- `server/trpc/routers/article.ts`
  - `generate`
  - `optimize`
  - `analyzeSEO`
  - `suggestLinks`

**External Service Integration:**
- `lib/services/article-generator.ts`
- `lib/services/seo-analyzer.ts`
- `lib/services/openai.ts`

**6.2 Article Editor**
- Rich text editor (Tiptap)
- Real-time SEO score
- SEO metrics sidebar
- Keyword density checker
- Meta editor
- Featured image upload
- Preview functionality

**tRPC Router:**
- `server/trpc/routers/article.ts`
  - `getById`
  - `update`
  - `updateContent`
  - `updateMeta`
  - `uploadImage`
  - `calculateScore`

**Files to create:**
- `app/dashboard/articles/[id]/page.tsx`
- `app/dashboard/articles/new/page.tsx`
- `components/dashboard/ArticleEditor.tsx`
- `components/dashboard/SEOSidebar.tsx`

**6.3 Article Management**
- List with filters
- Status management
- Bulk actions
- Analytics

**tRPC Router:**
- `server/trpc/routers/article.ts`
  - `list`
  - `updateStatus`
  - `bulkUpdate`
  - `delete`
  - `getAnalytics`

**Files to modify:**
- `app/dashboard/articles/page.tsx`
- `components/dashboard/ArticleList.tsx`

### Phase 7: Publishing & Integrations (Priority: High)

**7.1 Integration System**
- Platform-specific integrations
- Connection management
- Credential storage (encrypted)
- Connection testing

**tRPC Router:**
- `server/trpc/routers/integration.ts`
  - `connect`
  - `disconnect`
  - `test`
  - `list`
  - `update`

**Integration Implementations:**
- `lib/integrations/wordpress.ts`
- `lib/integrations/shopify.ts`
- `lib/integrations/webflow.ts`
- `lib/integrations/wix.ts`
- `lib/integrations/base.ts` (abstract class)

**Files to modify:**
- `app/dashboard/settings/integrations/page.tsx`

**7.2 Auto-Publishing**
- Publishing queue
- Scheduled publishing
- Retry logic
- Status tracking

**tRPC Router:**
- `server/trpc/routers/publish.ts`
  - `queue`
  - `publish`
  - `getStatus`
  - `retry`

**Background Jobs:**
- `lib/jobs/publish-job.ts`
- `lib/services/publisher.ts`

**7.3 RSS Feed & Webhooks**
- RSS feed generation
- Webhook endpoints
- Webhook event system

**tRPC Router:**
- `server/trpc/routers/webhook.ts`
  - `generateRSS`
  - `createWebhook`
  - `trigger`

**Files to create:**
- `app/api/rss/[projectId]/route.ts`
- `app/api/webhooks/[id]/route.ts`

### Phase 8: Backlink Exchange Network (Priority: Medium)

**8.1 Backlink Network**
- Network joining/leaving
- Partner matching
- Quality scoring
- Automatic exchange

**tRPC Router:**
- `server/trpc/routers/backlink.ts`
  - `joinNetwork`
  - `leaveNetwork`
  - `findPartners`
  - `exchange`
  - `list`
  - `getStats`

**Files to modify:**
- `app/dashboard/backlinks/page.tsx`
- `components/dashboard/BacklinkChart.tsx`

**8.2 Backlink Analytics**
- Growth tracking
- Quality metrics
- Reporting

**tRPC Router:**
- `server/trpc/routers/backlink.ts`
  - `getAnalytics`
  - `getGrowth`

### Phase 9: Analytics & Reporting (Priority: Medium)

**9.1 Google Search Console Integration**
- OAuth connection
- Data import
- Ranking tracking
- Performance analysis

**tRPC Router:**
- `server/trpc/routers/search-console.ts`
  - `connect`
  - `disconnect`
  - `importData`
  - `getRankings`
  - `getPerformance`

**External Service:**
- `lib/services/search-console.ts`

**9.2 Dashboard Analytics**
- Real-time stats
- Growth metrics
- Performance tracking

**tRPC Router:**
- `server/trpc/routers/analytics.ts`
  - `getDashboard`
  - `getArticlePerformance`
  - `getKeywordRankings`

**Files to modify:**
- `app/dashboard/page.tsx`
- `components/dashboard/StatsCards.tsx`

### Phase 10: Settings & Configuration (Priority: Medium)

**10.1 Project Settings**
- Website configuration
- Brand voice
- Language settings
- Content guidelines

**tRPC Router:**
- `server/trpc/routers/settings.ts`
  - `getProject`
  - `updateProject`
  - `getArticles`
  - `updateArticles`

**Files to modify:**
- `app/dashboard/settings/project/page.tsx`
- `app/dashboard/settings/articles/page.tsx`

### Phase 11: Billing & Subscriptions (Priority: Medium)

**11.1 Polar Payments Integration**
- Subscription management
- Plan selection
- Payment processing
- Invoice generation

**tRPC Router:**
- `server/trpc/routers/billing.ts`
  - `getSubscription`
  - `createCheckout`
  - `updatePlan`
  - `cancel`
  - `getInvoices`

**Polar Webhook Handler:**
- `app/api/polar/webhook/route.ts`

**Files to modify:**
- `app/dashboard/settings/billing/page.tsx`
- `lib/services/billing.ts`

**11.2 Subscription Management**
- Plan features
- Usage tracking
- Feature gating
- Trial management

**Middleware:**
- `lib/middleware/subscription-check.ts`

### Phase 12: Multi-Site & Agency Features (Priority: Low)

**12.1 Multi-Site Management**
- Site switching
- Per-site settings
- Bulk operations

**tRPC Router:**
- `server/trpc/routers/site.ts`
  - `list`
  - `switch`
  - `bulkOperation`

**12.2 Agency Features**
- Client management
- White-label options
- Volume discounts

**tRPC Router:**
- `server/trpc/routers/agency.ts`
  - `getClients`
  - `addClient`
  - `getDiscounts`

## File Structure

```
/
├── app/
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── auth/[...all]/route.ts
│   │   ├── polar/webhook/route.ts
│   │   ├── rss/[projectId]/route.ts
│   │   └── webhooks/[id]/route.ts
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── articles/
│   │   ├── keywords/
│   │   ├── calendar/
│   │   ├── backlinks/
│   │   └── settings/
│   └── login/
├── server/
│   └── trpc/
│       ├── trpc.ts
│       ├── context.ts
│       ├── router/
│       │   ├── _app.ts
│       │   ├── index.ts
│       │   ├── auth.ts
│       │   ├── user.ts
│       │   ├── project.ts
│       │   ├── keyword.ts
│       │   ├── calendar.ts
│       │   ├── article.ts
│       │   ├── integration.ts
│       │   ├── publish.ts
│       │   ├── backlink.ts
│       │   ├── analytics.ts
│       │   ├── settings.ts
│       │   └── billing.ts
│       └── middleware/
├── lib/
│   ├── auth.ts
│   ├── polar.ts
│   ├── db.ts
│   ├── trpc/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── services/
│   │   ├── article-generator.ts
│   │   ├── seo-analyzer.ts
│   │   ├── keyword-research.ts
│   │   ├── search-console.ts
│   │   ├── publisher.ts
│   │   └── billing.ts
│   ├── integrations/
│   │   ├── base.ts
│   │   ├── wordpress.ts
│   │   ├── shopify.ts
│   │   └── webflow.ts
│   └── jobs/
│       └── publish-job.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── components/
    └── dashboard/
```

## Implementation Priority Order

1. **Phase 1** - Foundation (tRPC, Prisma, Neon, Better Auth, Polar setup)
2. **Phase 2** - Authentication (Better Auth implementation)
3. **Phase 3** - Project Management
4. **Phase 6** - Article Generation (core product)
5. **Phase 4** - Keyword Management
6. **Phase 5** - Content Planning
7. **Phase 7** - Publishing & Integrations
8. **Phase 8** - Backlink Network
9. **Phase 9** - Analytics
10. **Phase 10** - Settings
11. **Phase 11** - Billing
12. **Phase 12** - Multi-site/Agency

## Key Implementation Steps

### Step 1: Initial Setup
1. Install all dependencies
2. Set up Neon DB and get connection string
3. Configure Prisma with Neon
4. Run initial migrations
5. Set up Better Auth
6. Configure Polar Payments
7. Set up tRPC infrastructure

### Step 2: Core Features
1. Implement authentication flow
2. Create project management
3. Build article generation engine
4. Implement keyword discovery
5. Create content calendar
6. Build publishing system

### Step 3: Advanced Features
1. Integration connections
2. Backlink network
3. Analytics and reporting
4. Billing integration
5. Multi-site support

## Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:5001"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Polar Payments
POLAR_ACCESS_TOKEN="..."
POLAR_WEBHOOK_SECRET="..."

# OpenAI
OPENAI_API_KEY="..."

# Keyword Research API
KEYWORD_API_KEY="..."

# Google Search Console
GSC_CLIENT_ID="..."
GSC_CLIENT_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:5001"
```

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Initialize database and run migrations
4. Begin Phase 1 implementation
5. Iterate through phases in priority order
