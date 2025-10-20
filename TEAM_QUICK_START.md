# Team Setup Guide

## Quick Setup (3 steps)

### 1. Clone and Install
```bash
git clone [your-repo-url]
cd peerly-app
npm install
```

### 2. Create Environment File
Create `.env.local` with these credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://sebscmgcuosemsztmsoq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Njc5MTEsImV4cCI6MjA3NjU0MzkxMX0.yAXBffpkHUDwefxjFx2bHcPMy02l0dAF54HlsB6M6uQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2NzkxMSwiZXhwIjoyMDc2NTQzOTExfQ.yIgB6vF8ltOMxzBN5ArWAn3zoXKeow8YA8HceMe99Rk
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Building
```bash
# Import Supabase client
import { supabase } from './lib/supabase.ts'

# Start your React Native/Expo project
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
