# Quick Reference Guide

## Get Started in 30 Seconds

```bash
# 1. Install
pnpm install

# 2. Set up .env.local
echo 'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key' > .env.local

# 3. Run
pnpm dev

# 4. Open http://localhost:3000
```

---

## Main Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home page entry |
| `components/dashboard.tsx` | Main UI orchestrator |
| `app/api/jobs/route.ts` | Job submit/list endpoints |
| `app/api/jobs/[id]/execute/route.ts` | Job executor |
| `app/api/grid-status/route.ts` | Grid data |
| `lib/supabase/client.ts` | Database client |

---

## Common Tasks

### Submit a Job
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"test\")"}'
```

### Get All Jobs
```bash
curl http://localhost:3000/api/jobs
```

### Execute a Job
```bash
curl -X POST http://localhost:3000/api/jobs/{id}/execute
```

### Download Certificate
```bash
curl http://localhost:3000/api/jobs/{id}/certificate > cert.pdf
```

### Check Grid Status
```bash
curl http://localhost:3000/api/grid-status
```

---

## Test Code Snippets

### Simple (Low Priority)
```python
print("Hello, green grid!")
```

### Framework Detection (Medium Priority)
```python
import pandas as pd
df = pd.DataFrame({'a': [1,2,3]})
print(df.mean())
```

### Real-Time Framework (High Priority)
```python
import fastapi
app = fastapi.FastAPI()
print("App created")
```

### Error Handling
```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Error caught")
```

---

## Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your anon key

**Optional:**
- `ELECTRICITY_MAPS_API_KEY` - For real grid data
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Auth callback

---

## Key Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/jobs` | Submit job |
| GET | `/api/jobs` | List jobs |
| POST | `/api/jobs/[id]/execute` | Execute job |
| GET | `/api/grid-status` | Get grid data |
| GET | `/api/jobs/[id]/certificate` | Download PDF |

---

## Priority Thresholds

| Priority | Max Intensity | Examples |
|----------|---------------|----------|
| High | 250 | fastapi, flask |
| Medium | 150 | pandas, numpy |
| Low | 50 | Default scripts |

---

## Database Tables

### jobs
```sql
id, status, code, priority, max_carbon_intensity,
inferred_imports, stdout, stderr, 
grid_intensity_at_execution,
execution_start_time, execution_end_time,
created_at, updated_at
```

### grid_history
```sql
id, carbon_intensity, timestamp, created_at
```

---

## Component Tree

```
Dashboard
├── GridStatusWidget
├── JobSubmissionForm
└── JobsList
    ├── Job Details
    └── Certificate Link
```

---

## Polling Intervals

- **Grid Status**: 15 seconds
- **Jobs List**: 10 seconds
- **Background Executor** (optional): 30 seconds

---

## Error Messages

| Message | Solution |
|---------|----------|
| "Python not found" | Install Python 3 |
| "Supabase connection failed" | Check .env.local |
| "Unable to fetch carbon intensity" | Check API key or enable mock |
| "Job not found" | Check job ID |
| "Code execution timeout" | Script took > 30s |

---

## Development Tips

### Enable Debug Logging
```typescript
console.log("[v0] Message here:", data)
```

### Change Grid Zone
Edit `/app/api/grid-status/route.ts`:
```typescript
zone: 'US-TX'  // Change from US-CA
```

### Adjust Polling Rate
Edit component:
```typescript
const interval = setInterval(fetch, 20000)  // 20s instead of 15s
```

### Add Framework to Priority Map
Edit `/app/api/jobs/route.ts`:
```typescript
myframework: { priority: 'high', max_carbon_intensity: 250 }
```

---

## Deployment Checklist

- [ ] Set environment variables
- [ ] Configure Supabase project
- [ ] (Optional) Get ElectricityMaps API key
- [ ] Build: `pnpm build`
- [ ] Test production build: `pnpm start`
- [ ] Deploy: `vercel deploy` or equivalent

---

## File Size Reference

| Category | Files | Total |
|----------|-------|-------|
| Components | 4 | ~500 LOC |
| API Routes | 4 | ~400 LOC |
| Config/Utils | 5 | ~200 LOC |
| Documentation | 7 | ~2000 LOC |

---

## Quick Stats

- **API Routes**: 5 endpoints
- **Components**: 4 main + 10 UI
- **Database Tables**: 2
- **Frontend Polls**: 2 intervals (15s, 10s)
- **Code Execution Timeout**: 30 seconds
- **Max Buffer**: 10MB
- **PDF Pages**: Dynamic (1-5)

---

## Browser DevTools Tips

### Network Tab
- Monitor `/api/grid-status` (15s)
- Monitor `/api/jobs` (10s)
- Check response times

### Console
- Look for `[v0]` debug logs
- Check for errors
- Monitor memory

### Application
- Local storage (unused here)
- Cookies (Supabase session)
- DB queries (none - all via API)

---

## Command Shortcuts

```bash
# Install & run
pnpm install && pnpm dev

# Clean install
rm -rf node_modules pnpm-lock.yaml && pnpm install

# Build & test production
pnpm build && pnpm start

# Lint check
pnpm next lint

# Type check
pnpm next build
```

---

## Important URLs

- **App**: http://localhost:3000
- **API**: http://localhost:3000/api/
- **Supabase**: https://app.supabase.com
- **ElectricityMaps**: https://api.electricityMaps.com
- **GitHub**: Your repo

---

## Support Resources

1. **Stuck?** → Check `SETUP.md`
2. **How it works?** → Read `ARCHITECTURE.md`
3. **Component details?** → See `COMPONENTS.md`
4. **Testing?** → Follow `TESTING.md`
5. **General overview?** → Start with `README.md`

---

## Next Steps

1. ✅ Install and run locally
2. ✅ Test with example Python code
3. ✅ Download a green certificate
4. ✅ Set up ElectricityMaps API key
5. ✅ Deploy to production
6. ✅ Add authentication
7. ✅ Scale to multiple regions

---

## Success Criteria

- [ ] Server starts without errors
- [ ] Grid widget shows current intensity
- [ ] Can submit Python code
- [ ] Can execute job
- [ ] Can download PDF certificate
- [ ] All API endpoints respond
- [ ] Database has data
- [ ] UI is responsive

✅ **You're ready to build green!**

---

Made with ⚡ for sustainable computing.
