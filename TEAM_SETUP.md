# Team Setup Instructions

## For Team Members

1. **Clone the repository**
2. **Copy the environment template**: `cp supabase-config-template.txt .env.local`
3. **Get Supabase credentials** from the team lead (Hamza)
4. **Fill in `.env.local`** with the provided credentials

## Supabase Credentials (Share with Team)

**Project URL**: `https://sebscmgcuosemsztmsoq.supabase.co`
**Publishable Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Njc5MTEsImV4cCI6MjA3NjU0MzkxMX0.yAXBffpkHUDwefxjFx2bHcPMy02l0dAF54HlsB6M6uQ`
**Secret Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2NzkxMSwiZXhwIjoyMDc2NTQzOTExfQ.yIgB6vF8ltOMxzBN5ArWAn3zoXKeow8YA8HceMe99Rk`

## Environment File Template

```bash
# Copy this to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://sebscmgcuosemsztmsoq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Njc5MTEsImV4cCI6MjA3NjU0MzkxMX0.yAXBffpkHUDwefxjFx2bHcPMy02l0dAF54HlsB6M6uQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlYnNjbWdjdW9zZW1zenRtc29xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk2NzkxMSwiZXhwIjoyMDc2NTQzOTExfQ.yIgB6vF8ltOMxzBN5ArWAn3zoXKeow8YA8HceMe99Rk
GEMINI_API_KEY=your_gemini_api_key_here
```

## Important Notes

- **Never commit `.env.local`** to git (it's in .gitignore)
- **Share credentials securely** (use Slack DM or encrypted message)
- **Each team member** needs their own `.env.local` file
- **The publishable key is safe** to share (it's designed for client-side use)

## Next Steps

1. Team members should run: `supabase link --project-ref YOUR_PROJECT_ID`
2. Apply database schema: `supabase db push`
3. Start development!
