# Wingside Full-Stack Setup Guide

This guide will help you convert the Wingside project from a static site to a full-stack application with database, authentication, and admin features.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at https://supabase.com)
- Git installed

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install -D @types/node
```

## Step 2: Set Up Supabase Project

### Option A: Use Supabase Cloud (Recommended for beginners)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Wait for the project to be provisioned (2-3 minutes)
4. Go to Project Settings > API
5. Copy your Project URL and anon/public key
6. Go to Project Settings > Database
7. Copy your database connection string

### Option B: Use Local Supabase (For development)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
npx supabase init

# Start local Supabase (requires Docker)
npx supabase start
```

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Set Up the Database

### Using Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `database-schema.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the schema

### Using Supabase CLI:

```bash
npx supabase db push
```

## Step 5: Seed Initial Data (Optional)

You can populate the database with your existing product data:

1. Go to Supabase Dashboard > Table Editor
2. Manually add categories, flavors, and products
3. Or use the seed script (to be created)

## Step 6: Test the Connection

```bash
npm run dev
```

Visit http://localhost:3000 and check the browser console for any errors.

## Step 7: Set Up Authentication

Supabase provides built-in authentication. To enable it:

1. Go to Authentication > Providers in Supabase Dashboard
2. Enable Email provider (enabled by default)
3. Optionally enable Google, GitHub, etc.
4. Configure email templates under Authentication > Email Templates

## Project Structure After Setup

```
wingside/
├── app/
│   ├── api/              # API routes
│   │   ├── products/     # Product endpoints
│   │   ├── orders/       # Order endpoints
│   │   └── auth/         # Auth endpoints
│   ├── admin/            # Admin dashboard
│   ├── (auth)/           # Auth pages (login, signup)
│   └── ...
├── lib/
│   ├── supabase/         # Supabase clients
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server client
│   │   └── middleware.ts # Auth middleware
│   └── db/               # Database utilities
├── database-schema.sql   # Database schema
├── .env.local           # Environment variables (not in git)
└── .env.example         # Example env vars (in git)
```

## Next Steps

1. Create API routes for products
2. Create API routes for orders
3. Build authentication pages
4. Build admin dashboard
5. Migrate hardcoded data to database
6. Deploy to Vercel

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel automatically supports Next.js server features.

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Supabase connection errors
- Check your .env.local file
- Verify your Supabase project is running
- Check that your API keys are correct

### Database errors
- Verify the schema was applied correctly
- Check table permissions in Supabase Dashboard

## Support

- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Project issues: Create an issue in your repository
