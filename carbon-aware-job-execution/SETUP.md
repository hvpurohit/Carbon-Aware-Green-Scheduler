# Setup Guide - Carbon-Aware Execution Platform

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ and pnpm
- Python 3.6+
- A Supabase project (free tier available at supabase.com)

### 2. Clone & Install
```bash
git clone <your-repo>
cd carbon-aware-platform
pnpm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to **Settings > Database > Connection Pooling** and enable it
3. Copy your project URL and anon key
4. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### 4. Database Setup

The tables are automatically created when you first run the app. If they don't exist, run:

```bash
pnpm supabase:push  # If using Supabase CLI
# OR manually create tables via Supabase dashboard
```

Alternatively, connect in v0 and use the Supabase MCP to run the SQL directly.

### 5. Start Development Server
```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

### 6. Test It Out!

1. **Try the simple test:**
   ```python
   print("Hello, green grid!")
   ```

2. **Try with a framework (Medium priority):**
   ```python
   import pandas as pd
   print(pd.__version__)
   ```

3. **Try a real script:**
   ```python
   def fibonacci(n):
       if n <= 1:
           return n
       return fibonacci(n-1) + fibonacci(n-2)
   
   print(fibonacci(10))
   ```

## Optional: ElectricityMaps Integration

For real carbon intensity data (instead of mock data):

1. Get free API key from https://electricityMaps.com
2. Add to `.env.local`:
   ```env
   ELECTRICITY_MAPS_API_KEY=your-api-key-here
   ```
3. Update the zone in `/app/api/grid-status/route.ts` (default: US-CA)

Without this, the system uses randomized mock data (50-450 gCO2eq/kWh).

## Vercel Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com
2. Click "Add New... > Project"
3. Import your GitHub repository
4. Fill in environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ELECTRICITY_MAPS_API_KEY` (optional)

### 3. Handle Python Execution

**⚠️ Important:** The default Vercel deployment doesn't include Python. You have options:

**Option A: Use Vercel + AWS Lambda (Recommended)**
```bash
# Modify /api/jobs/[id]/execute/route.ts to invoke Lambda
# instead of local subprocess
```

**Option B: Use Vercel + Hugging Face Spaces**
```bash
# Stream code to external Python execution service
```

**Option C: Self-Host on Railway/Heroku**
```bash
# Use Docker with Node + Python included
docker build -t carbon-aware .
```

For local/demo purposes, Vercel Preview works fine with Python.

## Troubleshooting

### "Python not found"
- Install Python 3: `brew install python3` (macOS) or `apt install python3` (Linux)
- Verify: `python3 --version`

### "Supabase connection failed"
- Check `.env.local` has correct URL and key
- Verify Supabase project is active
- Check internet connection

### "Grid status returns error"
- Without API key, uses mock data (OK for testing)
- To use real data, get API key from electricityMaps.com

### "Jobs not executing"
- Check browser console for errors
- Verify API routes exist: `curl http://localhost:3000/api/jobs`
- Ensure Supabase tables exist

### "Certificate PDF is blank"
- Check PDF generation (pdfkit) installed: `npm ls pdfkit`
- Verify job has execution data before downloading

## Development Tips

### File Structure
```
app/
  api/                          # Backend routes
    grid-status/route.ts        # Real-time grid data
    jobs/route.ts               # Job CRUD + priority inference
    jobs/[id]/execute/route.ts  # Job execution engine
    jobs/[id]/certificate/route.ts  # PDF generation
  page.tsx                       # Home page (server component)
  jobs/[id]/certificate/page.tsx # Certificate view

components/
  dashboard.tsx                  # Main wrapper (client)
  grid-status-widget.tsx        # Grid display (polls 15s)
  job-submission-form.tsx       # Code editor
  jobs-list.tsx                 # Job status list (polls 10s)

lib/
  supabase/
    client.ts                   # Client initialization
    server.ts                   # Server initialization
  job-executor.ts               # Optional background executor
```

### Adding Custom Priority Rules

Edit `/app/api/jobs/route.ts`:

```typescript
const PRIORITY_MAP = {
  // Your framework here
  myframework: { priority: 'high', max_carbon_intensity: 250 },
  // ...
}
```

### Changing Grid Zone

Edit `/app/api/grid-status/route.ts`:

```typescript
params: {
  zone: 'US-TX',  // Change here (US-CA, EU-DE, etc.)
}
```

### Adjusting Polling Intervals

**Grid Status** - `/components/grid-status-widget.tsx`:
```typescript
const interval = setInterval(fetchGridStatus, 15000) // Change ms
```

**Jobs List** - `/components/jobs-list.tsx`:
```typescript
useEffect(() => {
  const interval = setInterval(fetchJobs, 10000) // Change ms
}, [])
```

### Running Background Executor

Optional: Auto-execute queued jobs in the background:

```typescript
// In app/page.tsx or a layout client component
import { jobExecutor } from '@/lib/job-executor'

useEffect(() => {
  jobExecutor.start() // Polls every 30 seconds for queued jobs
  return () => jobExecutor.stop()
}, [])
```

## Production Checklist

- [ ] Set up proper error logging (Sentry, etc.)
- [ ] Enable CORS if APIs called from other domains
- [ ] Add rate limiting to API routes
- [ ] Set up job timeout (currently 30s)
- [ ] Configure Python execution sandbox/restrictions
- [ ] Add authentication if needed
- [ ] Set up monitoring for grid API uptime
- [ ] Configure database backups
- [ ] Review and limit resource usage
- [ ] Add job retry logic for failures

## Support

For issues or questions:
1. Check ARCHITECTURE.md for detailed docs
2. Review API routes for implementation
3. Check Supabase dashboard for data
4. Enable debug logging: `console.log("[v0] ...")`

Happy green coding! 🌱
