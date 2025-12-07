# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wingside is a chicken wings restaurant website built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. The site showcases 20 wing flavors across 6 categories and includes an ordering system.

**Deployment**: Static export configured for Vercel deployment (`output: 'export'`).

## Development Commands

```bash
# Development server
npm run dev                 # Start dev server at http://localhost:3000

# Production build & deployment
npm run build              # Build static export to /out directory
npm start                  # Start production server (port from $PORT env var)

# Code quality
npm run lint               # Run ESLint
```

## Architecture

### Static Export Configuration

This project uses Next.js static export (`output: 'export'` in next.config.ts):
- **Build output**: `out/` directory (not `.next/`)
- **Images**: Unoptimized (`images.unoptimized: true`)
- **Trailing slashes**: Enabled for proper routing
- **No server-side features**: No API routes, server components run at build time only

### App Structure (Next.js 14+ App Router)

```
app/
├── layout.tsx          # Root layout with Header/Footer, Poppins font
├── page.tsx           # Homepage with hero video, flavors catalog, delivery section
├── order/
│   └── page.tsx       # Order page with cart functionality
├── error.tsx          # Error boundary
├── not-found.tsx      # 404 page
└── globals.css        # Global styles with Tailwind + custom CSS
```

### Component Architecture

**Shared Components** (`components/`):
- `Header.tsx`: Navigation with sliding sidebar menu, logo, CTA buttons
- `Footer.tsx`: Newsletter signup, social links, footer navigation

**Client Components**: All page components and shared components use `"use client"` directive due to:
- State management (useState for cart, menu, categories)
- Event handlers (onClick, form interactions)
- Animations and transitions

### Styling System

**Design Tokens** (defined in `globals.css` and `tailwind.config.js`):
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

### Data Management

**In-Memory State**:
- Flavors data: Hardcoded in `app/page.tsx` (13 flavors across 6 categories)
- Products data: Hardcoded in `app/order/page.tsx` (wings packs with 20 flavor options)
- Cart state: Local React state (not persisted)

**No Backend**: Static site with no database or API routes.

### Path Aliases

TypeScript configured with `@/*` alias mapping to root directory:
```typescript
import Header from "@/components/Header";
```

## Key Features Implementation

### 1. Hero Video Section
- Video background (`/wingbanner.mp4`) with gradient overlay
- Responsive height scaling (60vh-80vh based on screen size)
- Positioned text overlay with brand colors

### 2. Flavor Catalog
- Category filtering (BBQ, HOT, SPICY DRY, BOLD & FUN, SWEET, BOOZY)
- Responsive grid layout with flavor images and descriptions
- "Order Now" CTAs linking to `/order`

### 3. Order System
- Multi-step selection: Category → Product → Flavor → Size → Quantity
- Shopping cart with real-time total calculation
- Nigerian Naira (₦) currency formatting
- Local state management (no persistence or checkout integration)

### 4. Navigation
- Sliding sidebar menu with smooth animations (fadeIn/slideIn)
- Centered logo with left menu button and right CTAs
- Links to future sections: Wingside Business, Wingcafé, Gifts, Connect, Hotspots, Kids, Sports

## Common Modification Patterns

### Adding a New Flavor
1. Add flavor object to `flavors` array in `app/page.tsx` with category, descriptions, and image path
2. Add image to `/public/` directory
3. Update flavor list in `app/order/page.tsx` products if needed

### Adding a New Product
1. Add product to `products` array in `app/order/page.tsx`
2. Include flavors array, sizes array, and badge (optional)
3. Add product image to `/public/`

### Modifying Design Tokens
1. Update Tailwind config (`tailwind.config.js`) for color/spacing changes
2. Update CSS variables in `globals.css` `@theme` block
3. Modify custom CSS classes in `globals.css` for component-specific styles

### Adding a New Page
1. Create directory under `app/` (e.g., `app/wingclub/`)
2. Add `page.tsx` with `"use client"` if using interactivity
3. Update navigation links in `Header.tsx` and `Footer.tsx`

## Build & Deployment Notes

- **Static files**: After `npm run build`, deploy the `/out` directory
- **Assets**: All images/videos in `/public` are copied to build output
- **Vercel**: Configured with `trailingSlash: true` for proper routing
- **No SSR/ISR**: All pages are pre-rendered at build time

## Code Style

- **TypeScript**: Strict mode enabled, interface types for complex objects
- **React**: Functional components with hooks (no class components)
- **Imports**: Next.js `Link` and `Image` for navigation and images (though Image uses unoptimized mode)
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Client directive**: Place `"use client"` at top of file when using state/effects/events
