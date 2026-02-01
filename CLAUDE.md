# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wingside is a full-stack e-commerce platform for a chicken wings restaurant, built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. The platform features 20 wing flavors across 6 categories, online ordering with payment integration, loyalty rewards, admin dashboard, and customer management.

**Architecture**: Dynamic Next.js application with API routes, server-side rendering, and database integration.

**Deployment**: Configured for Vercel, VPS, or Hostinger deployments with Node.js runtime.

## Development Commands

```bash
# Development server
npm run dev                 # Start dev server at http://localhost:3000

# Production build & deployment
npm run build              # Build for production to /.next directory
npm start                  # Start production server (port from $PORT env var)

# Code quality
npm run lint               # Run ESLint
npm run analyze            # Analyze bundle size
```

## Architecture

### Application Type

This is a **dynamic Next.js application** with:
- **Build output**: `.next/` directory (standard Next.js build)
- **API Routes**: 100+ API endpoints for backend operations
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Caching**: Redis + in-memory fallback for performance
- **Authentication**: Supabase Auth with SSR support
- **Images**: Optimized via Next.js Image component (Supabase CDN)
- **Trailing slashes**: Enabled for proper routing

### Tech Stack

**Frontend**:
- Next.js 16 (App Router)
- React 19 with Server Components
- TypeScript (strict mode disabled)
- Tailwind CSS 4 with `@theme` directive
- Inter font family

**Backend**:
- Supabase (PostgreSQL database, Auth, Storage)
- Redis (ioredis) for caching
- Node.js API routes
- Web Push notifications
- Email (Resend API)
- SMS (Termii API)

**Payments & Integrations**:
- Paystack payment gateway
- Embedly wallet integration
- Nomba payment gateway
- Webhook handlers (n8n, notifications)

**Security**:
- CSRF protection
- Rate limiting
- Bot protection (Turnstile, reCAPTCHA, hCaptcha)
- Honeypot fields
- Row Level Security (RLS) in database

### App Structure (Next.js App Router)

```
app/
├── layout.tsx                  # Root layout with Header/Footer, Inter font
├── page.tsx                    # Homepage: hero slideshow, flavors, delivery sections
├── globals.css                 # Global styles with Tailwind 4 + custom CSS
├── admin-layout-wrapper.tsx    # Conditionally renders Header/Footer
│
├── (auth)/
│   └── login/                  # Unified login page (redirects to /my-account)
│
├── order/
│   └── page.tsx               # Order page with cart (persisted to localStorage)
│
├── my-account/                 # Customer dashboard
│   ├── page.tsx               # Account overview, orders, wallet, rewards
│   ├── my-addresses/          # Address management
│   └── layout.tsx             # Account layout
│
├── admin/                      # Admin dashboard (protected)
│   ├── analytics/             # Sales analytics, charts
│   ├── customers/             # Customer management
│   ├── categories/            # Product categories
│   ├── flavors/               # Flavor management
│   ├── hero-slides/           # Homepage slideshow
│   ├── blog/                  # Blog post management
│   ├── social-verifications/  # Social media reward verifications
│   ├── job-applications/      # Career applications
│   ├── contact-submissions/   # Contact form submissions
│   ├── delivery-areas/        # Delivery zones
│   ├── maintenance/           # Maintenance mode toggle
│   └── users/                 # User management
│
├── api/                        # 100+ API routes
│   ├── auth/                  # CSRF tokens
│   ├── payment/               # Paystack initialization
│   ├── orders/                # Order management
│   ├── products/              # Product CRUD
│   ├── flavors/               # Flavor CRUD
│   ├── categories/            # Category management
│   ├── promo-codes/           # Promo code validation
│   ├── referrals/             # Referral system
│   ├── rewards/               # Points and rewards
│   ├── user/                  # User profile, addresses, wallet
│   ├── admin/                 # Admin-only endpoints
│   ├── webhooks/              # Payment webhooks, n8n
│   ├── notifications/         # Push notifications, preferences
│   ├── embedly/               # Wallet integration
│   ├── delivery-areas/        # Delivery zone checks
│   ├── pickup-locations/      # Store locations
│   └── settings/              # App settings
│
├── blog/                       # Public blog
├── careers/                    # Job listings
├── hotspots/                   # Wingside Hotspot program
├── sports/                     # Sports events
├── wingclub/                   # Loyalty program info
├── about/                      # About page
├── terms/                      # Terms of service
├── privacy/                    # Privacy policy
├── maintenance/                # Maintenance mode page
├── error.tsx                   # Error boundary
└── not-found.tsx              # 404 page
```

### Component Architecture

**Shared Components** (`components/`):
- `Header.tsx`: Navigation with auth state, sliding sidebar menu, logo
- `Footer.tsx`: Newsletter signup (API-driven), social links, dynamic settings
- `HeroSlideshow.tsx`: Database-driven hero carousel
- `EmbedlyWalletSection.tsx`: Wallet balance and top-up
- `ConvertPointsModal.tsx`: Points-to-wallet conversion
- `SocialVerifyModal.tsx`: Social media reward verification
- `NotificationPreferences.tsx`: Push notification settings
- `BotProtection.tsx`: Turnstile/reCAPTCHA/hCaptcha integration
- `LoadingSkeleton.tsx`: Loading states
- Admin components in `components/admin/`

**Client vs Server Components**:
- Most page components use `"use client"` for interactivity
- API routes are server-side only
- Layout components conditionally render based on route

### Styling System

**Design Tokens** (defined in `globals.css` with `@theme`):
- Primary yellow: `#F7C400` (brand color for CTAs, accents)
- Primary light: `#FDF5E5` (backgrounds)
- Text dark: `#000000`
- Text brown: `#552627` (headings, emphasis)
- Gutter spacing: 60px (desktop), responsive on mobile/tablet

**Responsive Strategy**:
- Mobile-first with breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Custom `.gutter-x` utility for consistent horizontal padding
- Extensive use of custom CSS classes in `globals.css` for component styling
- Tailwind 4 with `@theme` directive for CSS variables

**Custom CSS Classes** (see `globals.css`):
- `.btn-primary`, `.btn-outline`: Button styles
- `.category-tab`, `.order-category-tab`: Category navigation
- `.flavor-image`, `.float-hover`: Image animations
- `.sidebar-*`: Menu sidebar animations
- `.hero-video-*`: Video hero section
- `.order-*`: Order page specific components
- `.wc-*`: Wingclub section styles

### Data Management

**Backend (Supabase)**:
- PostgreSQL database with Row Level Security
- Tables: products, flavors, categories, orders, order_items, customers, wallets, promo_codes, referrals, loyalty_tiers, hero_slides, blog_posts, etc.
- Real-time subscriptions for order updates
- Supabase Auth for authentication
- Supabase Storage for image uploads

**Caching Strategy** (`lib/redis.ts`):
1. Redis cache (primary) - 5-60 minute TTLs
2. In-memory cache (fallback) - 5 minute TTLs
3. ETag validation for 304 responses
4. Cache-busting via headers (`Cache-Control: no-cache`)

**State Management**:
- React state for UI interactions
- LocalStorage for cart persistence (`wingside-cart` key)
- Supabase client state for auth
- API fetching with cache headers

**API Data Flow**:
1. Client requests data from `/api/*` endpoints
2. API checks Redis cache (if available)
3. On cache miss, queries Supabase database
4. Response cached with ETags
5. Client receives data with cache headers

### Path Aliases

TypeScript configured with `@/*` alias mapping to root directory:
```typescript
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
```

### Environment Variables

Required variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `NEXT_PUBLIC_APP_URL` - Application URL (e.g., https://www.wingside.ng)
- `PAYSTACK_SECRET_KEY` - Paystack payment API key
- `REDIS_URL` - Redis connection URL (optional, falls back to memory cache)
- `RESEND_API_KEY` - Email service API key
- `TERMII_API_KEY` - SMS service API key
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web push notification key
- `VAPID_PRIVATE_KEY` - Web push private key

**Note**: Never commit `.env.local` or `.env.production` - use `.env.example` as template.

## Key Features Implementation

### 1. Hero Slideshow Section
- Database-driven slides from `hero_slides` table
- Fetched via `/api/hero-slides/public`
- Responsive video/image backgrounds (`/hero.mp4` is primary hero video)
- Auto-rotating carousel with manual controls
- Positioned text overlay with brand colors

### 2. Flavor Catalog (20 Flavors)
- **Categories**: BBQ, BOLD & FUN, HOT, DRY RUB, SWEET, BOOZY
- Data fetched from `/api/flavors` endpoint
- Cached in Redis (30 min TTL)
- Responsive grid layout with flavor images from Supabase Storage
- Spice level indicators
- Admin can manage via `/admin/flavors`

### 3. Order System
- Multi-step selection: Category → Product → Flavor → Size → Quantity
- Products fetched from `/api/products`
- Shopping cart persisted to localStorage
- Real-time total calculation with Nigerian Naira (₦) formatting
- Checkout integrates with Paystack
- Order status tracking and history

### 4. Customer Dashboard
- Order history with status tracking
- Wallet balance and transaction history
- Loyalty points and tier system
- Referral code generation and tracking
- Address management
- Social media reward claims

### 5. Admin Dashboard
- Sales analytics with charts (Recharts)
- Customer management and timeline
- Product/flavor/category CRUD
- Order management with status updates
- Promo code generation
- Blog post management
- Email template management
- Push notification sending
- System settings and maintenance mode

### 6. Loyalty & Rewards System
- Points earned per order
- Tiered system (Bronze, Silver, Gold, Platinum)
- Automatic tier upgrades/downgrades
- Points-to-wallet conversion
- Birthday rewards
- Referral rewards
- Social media engagement rewards

### 7. Payment Integration
- Paystack primary gateway
- Nomba gateway (secondary)
- Webhook handling for payment verification
- Wallet balance payment option
- Promo code application
- First order bonus

### 8. Notifications
- Web push notifications
- Email via Resend
- SMS via Termii
- In-app notification center
- Order status updates
- Promotional messages

## Common Modification Patterns

### Adding a New Flavor

1. Use admin dashboard at `/admin/flavors`
2. Or manually insert into `flavors` table in Supabase
3. Upload flavor image to Supabase Storage
4. Set category, spice level, and display order
5. Toggle `show_on_homepage` and `available_for_products`
6. API will automatically cache new data

### Adding a New Product

1. Use admin dashboard (when available)
2. Or manually insert into `products` table
3. Link to category via `category_id`
4. Add sizes in `product_sizes` table
5. Add flavors in product's `flavors` JSON array
6. Upload product image to Supabase Storage
7. Redis cache invalidates automatically on mutation

### Modifying Design Tokens

1. Update CSS variables in `globals.css` `@theme` block
2. Update Tailwind config (`tailwind.config.js`) for color/spacing aliases
3. Modify custom CSS classes in `globals.css` for component-specific styles
4. Rebuild to see changes

### Adding a New Page

1. Create directory under `app/` (e.g., `app/new-page/`)
2. Add `page.tsx` with `"use client"` if using interactivity
3. Update navigation links in `Header.tsx` sidebar menu
4. Add to `Footer.tsx` if needed
5. Consider adding to sitemap

### Adding a New API Route

1. Create file in `app/api/` (e.g., `app/api/new-endpoint/route.ts`)
2. Import Supabase client: `import { createClient } from '@/lib/supabase/server'`
3. Implement GET/POST/PUT/DELETE handlers
4. Add error handling and validation
5. Consider implementing caching via Redis
6. Add rate limiting if public endpoint
7. Document expected request/response format

### Database Schema Changes

1. Update schema in Supabase dashboard or via migrations
2. Update TypeScript types in `types/` directory
3. Update affected API routes
4. Update affected components
5. Test with existing data
6. Consider data migration if needed

## Build & Deployment Notes

### Build Output
- **Directory**: `.next/` (standard Next.js build)
- **Assets**: Images/videos in `/public` are served statically
- **API Routes**: Compiled to serverless functions
- **Server Components**: Pre-rendered when possible

### Deployment Targets

**Vercel** (Recommended):
- Automatic deployments via Git integration
- Environment variables configured in Vercel dashboard
- Serverless functions for API routes
- Edge caching enabled

**VPS/Hostinger**:
- Run `npm run build` to build
- Run `npm start` to start production server
- Use PM2 for process management (see `ecosystem.config.js`)
- Nginx reverse proxy for SSL and caching
- Environment variables in `.env.production`

### Performance Optimizations
- Redis caching for database queries
- ETag validation for 304 responses
- Next.js Image optimization with Supabase CDN
- Aggressive caching headers for static assets
- Bundle analysis available via `npm run analyze`

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials
3. Configure payment gateway keys (test mode for development)
4. Generate VAPID keys for push notifications: `node scripts/generate-vapid-keys.js`
5. Optional: Set up Redis for caching (falls back to memory cache)
6. Run `npm install` and `npm run dev`

## Code Style

- **TypeScript**: Strict mode disabled (`strict: false` in tsconfig.json), interface types for complex objects
- **JSX Transform**: Uses `"jsx": "react-jsx"` (non-standard for Next.js, consider changing to `"preserve"`)
- **React**: Functional components with hooks (no class components)
- **Imports**: Next.js `Link` and `Image` for navigation and images
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Client directive**: Place `"use client"` at top of file when using state/effects/events
- **API Routes**: Use `NextRequest`/`NextResponse` from `next/server`
- **Error Handling**: Try-catch blocks with proper error responses
- **Supabase**: Use `@/lib/supabase/client` for client-side, `@/lib/supabase/server` for server-side

## Security Considerations

- Row Level Security (RLS) enforced in Supabase
- CSRF tokens for state-changing operations
- Rate limiting on public API endpoints
- Input validation on all forms
- Bot protection on sensitive forms
- Service role key never exposed to client
- Secure cookie handling for auth
- SQL injection prevention via Supabase client
- XSS prevention via React's built-in escaping

## Testing & Debugging

- Check Redis connection: logs show "✅ Redis connected successfully"
- Redis unavailable: Falls back to memory cache automatically
- API debugging: Check `X-Cache` header (HIT/MISS/MEMORY)
- Auth issues: Check Supabase dashboard for user records
- Payment testing: Use Paystack test keys and test cards
- Order flow: Monitor database tables and webhook logs

## Known Issues & Limitations

1. TypeScript strict mode is disabled - consider enabling incrementally
2. JSX transform set to "react-jsx" instead of "preserve" (Next.js default)
3. Redis is optional but recommended for production performance
4. Some API routes don't check if Redis client is null before caching

## Additional Documentation

See project root for detailed guides:
- `NOMBA_BULLETPROOF_PLAN.md` - Payment gateway integration
- `ADVANCED_STREAK_IMPLEMENTATION.md` - Loyalty streak system
- `DEPLOYMENT.md` - Deployment procedures
- `SECURITY-IMPROVEMENTS.md` - Security best practices
- `DATABASE-SCHEMA.sql` - Complete database schema
