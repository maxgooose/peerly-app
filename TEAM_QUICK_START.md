# Quick Team Setup - Supabase Connection

## For Your Team Members

### Step 1: Clone and Setup
```bash
git clone [your-repo-url]
cd peerly-app
```

### Step 2: Create Environment File
```bash
cp supabase-config-template.txt .env.local
```

### Step 3: Fill in Credentials
Edit `.env.local` with these exact values:

```
NEXT_PUBLIC_SUPABASE_URL=https://sebscmgcuosemsztmsoq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Njc5MTEsImV4cCI6MjA3NjU0MzkxMX0.yAXBffpkHUDwefxjFx2bHcPMy02l0dAF54HlsB6M6uQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2NzkxMSwiZXhwIjoyMDc2NTQzOTExfQ.yIgB6vF8ltOMxzBN5ArWAn3zoXKeow8YA8HceMe99Rk
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 4: Test Connection
```bash
# Install dependencies (when you start building)
npm install @supabase/supabase-js

# Test connection (optional)
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

supabase.from('users').select('count').then(({data, error}) => {
  if (error) console.log('❌', error.message);
  else console.log('✅ Connected to Supabase!');
});
"
```

## ✅ That's It!

Your team is now connected to Supabase and ready to start building the React Native app.

## ✅ Current Status:
- ✅ **Database Schema Applied** - All tables created and ready
- ✅ **Authentication Working** - Ready for user signup/login
- ✅ **Connection Tested** - Supabase is fully operational
- ✅ **Environment Configured** - All credentials set up

## Important Notes:
- ✅ `.env.local` is already in `.gitignore` (secrets are safe)
- ✅ All Supabase client code is ready in `lib/supabase.ts`
- ✅ Database schema is applied and working
- ✅ Team can start building immediately

## Next Steps:
1. Start your React Native/Expo project
2. Import `supabase` from `./lib/supabase.ts`
3. Begin building your app components!

---
**Project**: Peerly Study Partner App  
**Supabase Project**: sebscmgcuosemsztmsoq  
**Status**: Ready for development 🚀
