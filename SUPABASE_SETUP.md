# Supabase Setup Guide

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## Step 2: Create Environment File

1. Copy `supabase-config-template.txt` to `.env.local`
2. Fill in your actual values:

```bash
cp supabase-config-template.txt .env.local
```

Then edit `.env.local` with your actual credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 3: Link Your Project

Run this command and follow the prompts:

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

You can find your project ID in the Supabase dashboard URL or in Settings → General.

## Step 4: Apply Database Schema

Run the migration to create all tables:

```bash
supabase db push
```

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Enable **Email** provider
3. Set **Site URL** to your app URL (for development: `http://localhost:3000`)
4. Add your domain to **Redirect URLs**

## Step 6: Test Connection

Create a simple test file to verify everything works:

```typescript
// test-supabase.ts
import { supabase } from './lib/supabase'

async function testConnection() {
  const { data, error } = await supabase.from('users').select('count')
  if (error) {
    console.error('Connection failed:', error)
  } else {
    console.log('✅ Supabase connected successfully!')
  }
}

testConnection()
```

## Next Steps

- Set up your React Native/Expo project
- Install Supabase client: `npm install @supabase/supabase-js`
- Start building your app components!

## Troubleshooting

- **Authentication errors**: Check your API keys and project URL
- **RLS errors**: Make sure Row Level Security policies are applied
- **Migration errors**: Check the SQL syntax in your migration files
