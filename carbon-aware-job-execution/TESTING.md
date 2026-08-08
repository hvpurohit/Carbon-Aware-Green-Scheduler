# Testing Guide - Carbon-Aware Execution Platform

## Unit Test Examples

### Test Submission Form

```typescript
// components/__tests__/job-submission-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JobSubmissionForm } from '@/components/job-submission-form'

describe('JobSubmissionForm', () => {
  it('submits code successfully', async () => {
    const onJobCreated = jest.fn()
    render(<JobSubmissionForm onJobCreated={onJobCreated} />)
    
    const textarea = screen.getByPlaceholderText(/Enter Python code/i)
    fireEvent.change(textarea, { target: { value: 'print("test")' } })
    
    const button = screen.getByText(/Submit Job/i)
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(onJobCreated).toHaveBeenCalled()
    })
  })
  
  it('disables submit with empty code', () => {
    render(<JobSubmissionForm onJobCreated={jest.fn()} />)
    const button = screen.getByText(/Submit Job/i)
    expect(button).toBeDisabled()
  })
})
```

### Test Priority Inference

```typescript
// __tests__/priority-inference.test.ts
import { inferPriority } from '@/app/api/jobs/priority'

describe('Priority Inference', () => {
  it('detects high priority frameworks', () => {
    const code = `
      import fastapi
      from flask import Flask
      app = Flask(__name__)
    `
    
    const { priority, max_carbon_intensity } = inferPriority(code)
    expect(priority).toBe('high')
    expect(max_carbon_intensity).toBe(250)
  })
  
  it('detects medium priority frameworks', () => {
    const code = `
      import pandas as pd
      import numpy as np
      df = pd.DataFrame(np.random.randn(10))
    `
    
    const { priority, max_carbon_intensity } = inferPriority(code)
    expect(priority).toBe('medium')
    expect(max_carbon_intensity).toBe(150)
  })
  
  it('defaults to low priority', () => {
    const code = `
      print("Hello world")
      x = 42
    `
    
    const { priority, max_carbon_intensity } = inferPriority(code)
    expect(priority).toBe('low')
    expect(max_carbon_intensity).toBe(50)
  })
})
```

## API Testing

### Using curl

```bash
# 1. Submit a job with high-priority code
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import fastapi\nprint(\"Server started\")"
  }'

# Response:
# {
#   "id": "123e4567-e89b-12d3-a456-426614174000",
#   "status": "queued",
#   "priority": "high",
#   "max_carbon_intensity": 250,
#   "inferred_imports": ["fastapi"],
#   "created_at": "2024-05-10T12:00:00Z"
# }

# 2. Get current grid status
curl http://localhost:3000/api/grid-status

# Response:
# {
#   "carbonIntensity": 145.2,
#   "timestamp": "2024-05-10T12:00:00Z",
#   "unit": "gCO2eq/kWh"
# }

# 3. List all jobs
curl http://localhost:3000/api/jobs

# Response:
# [
#   {
#     "id": "123e4567-e89b-12d3-a456-426614174000",
#     "status": "queued",
#     "priority": "high",
#     ...
#   }
# ]

# 4. Execute a job
curl -X POST http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000/execute

# Response:
# {
#   "id": "123e4567-e89b-12d3-a456-426614174000",
#   "status": "executing",
#   "grid_intensity_at_execution": 145.2,
#   "execution_start_time": "2024-05-10T12:00:01Z"
# }

# 5. Download certificate (after completion)
curl http://localhost:3000/api/jobs/123e4567-e89b-12d3-a456-426614174000/certificate > cert.pdf
```

### Using Postman

1. Create new POST request to `http://localhost:3000/api/jobs`
2. Headers: `Content-Type: application/json`
3. Body (raw JSON):
```json
{
  "code": "import pandas as pd\ndf = pd.DataFrame({'a': [1,2,3]})\nprint(df.mean())"
}
```
4. Send and copy the job ID from response
5. Create GET request to `/api/jobs/[job-id]/execute`
6. Wait a few seconds, then GET `/api/jobs/[job-id]/certificate`

## Manual Testing Scenarios

### Scenario 1: Simple Script Execution

**Steps:**
1. Open dashboard
2. Submit code: `print("Carbon-aware execution works!")`
3. Click "Execute" button
4. Wait for status to change from "queued" → "executing" → "completed"
5. Expand job details to see stdout

**Expected:**
- stdout contains "Carbon-aware execution works!"
- Execution duration shows in job details
- Grid intensity recorded

### Scenario 2: Framework Priority Detection

**Test High Priority (FastAPI):**
```python
import fastapi
app = fastapi.FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}

print("FastAPI app created")
```

**Verify:**
- Job badge shows "high" priority
- Max carbon intensity is 250 (not 150 or 50)

**Test Medium Priority (Pandas):**
```python
import pandas as pd
import numpy as np

data = np.random.randn(100)
s = pd.Series(data)
print(f"Mean: {s.mean():.2f}")
```

**Verify:**
- Job badge shows "medium" priority
- Max carbon intensity is 150

**Test Low Priority (No Framework):**
```python
def hello():
    return "Hello, World!"

print(hello())
```

**Verify:**
- Job badge shows "low" priority
- Max carbon intensity is 50

### Scenario 3: Grid Status Color Coding

**Watch the grid widget:**
- Green (< 100) - Perfect time to execute any workload
- Yellow (100-200) - OK for high/medium priority only
- Orange (200-300) - High priority only
- Red (> 300) - Consider deferring

**Test Delayed Job:**
1. Wait for grid to show red (> max threshold)
2. Submit a low-priority job
3. Click "Execute"
4. Job should be marked "delayed", not "executing"
5. If grid clears up, manually execute again

### Scenario 4: Certificate Generation

**Steps:**
1. Submit and execute a job successfully
2. Wait for status to show "completed"
3. Click "Certificate" button
4. Verify PDF opens with:
   - Green Certificate header
   - Job ID
   - Grid carbon intensity
   - Execution time
   - Detected frameworks
   - Code output

**Download and inspect PDF:**
```bash
# Save certificate
curl http://localhost:3000/api/jobs/[job-id]/certificate > /tmp/cert.pdf

# Open in viewer
open /tmp/cert.pdf  # macOS
xdg-open /tmp/cert.pdf  # Linux
```

### Scenario 5: Multiple Concurrent Jobs

**Steps:**
1. Submit 3 jobs in quick succession
2. Click "Execute" on multiple queued jobs
3. Monitor job list updates every 10 seconds
4. Verify execution order and status

**Expected:**
- Jobs execute sequentially or with configured concurrency
- Status updates in real-time
- No jobs stuck in "executing" state

### Scenario 6: Error Handling

**Test Python Syntax Error:**
```python
def broken(
    print "Missing closing paren"
```

**Verify:**
- Job status shows "failed"
- stderr contains syntax error message
- stdout is empty

**Test Runtime Error:**
```python
def divide_by_zero():
    return 10 / 0

divide_by_zero()
```

**Verify:**
- Job status shows "failed"
- stderr contains ZeroDivisionError

**Test Long-Running Job (should timeout):**
```python
import time
time.sleep(60)  # 60 seconds, but timeout is 30s
print("This won't print")
```

**Verify:**
- Job fails after ~30 seconds
- Error indicates timeout

## Load Testing

### Test Rapid Job Submissions

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/jobs \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"print($i)\"}"
  sleep 0.5
done

# Verify all 10 jobs in list
curl http://localhost:3000/api/jobs | jq '. | length'
```

### Test Polling Performance

Monitor in DevTools Network tab:
- `/api/grid-status` (15s interval)
- `/api/jobs` (10s interval)

**Verify:**
- Requests complete < 1 second each
- No memory leaks over time
- Network tab doesn't accumulate orphaned requests

## Database Testing

### Verify Tables Exist

```sql
-- In Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show: grid_history, jobs
```

### Test Data Persistence

```sql
-- Check jobs table has data
SELECT COUNT(*) FROM jobs;

-- Check grid history is being recorded
SELECT COUNT(*) FROM grid_history;

-- View recent jobs
SELECT id, status, priority, created_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 5;
```

### Test Indexes

```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('jobs', 'grid_history');

-- Should show:
-- idx_jobs_status
-- idx_jobs_created_at
-- idx_grid_history_timestamp
```

## Performance Testing

### Measure API Response Time

```bash
# Grid status endpoint
time curl http://localhost:3000/api/grid-status

# Jobs list endpoint
time curl http://localhost:3000/api/jobs

# Job execution endpoint
time curl -X POST http://localhost:3000/api/jobs/[job-id]/execute
```

**Expected:**
- All endpoints < 500ms (excluding external API calls)
- Grid status may be slower if waiting for ElectricityMaps API

### Monitor Browser Performance

1. Open DevTools → Lighthouse
2. Run performance audit
3. Verify:
   - FCP (First Contentful Paint) < 2s
   - LCP (Largest Contentful Paint) < 3s
   - No layout shifts

## Security Testing

### Test SQL Injection Prevention

```bash
# Try to inject SQL in code submission
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"code":"SELECT * FROM jobs; --"}'

# Should safely store as code, not execute as SQL
```

### Test XSS Prevention

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"code":"<script>alert(\"xss\")</script>"}'

# Code should be displayed as-is, not executed in browser
```

### Test Timeout Security

Verify jobs exceeding 30-second timeout are terminated:

```python
import time
# This should be killed before completing
while True:
    time.sleep(1)
    print("Running...")
```

## Continuous Integration

### Example GitHub Actions Workflow

```yaml
name: Test Carbon-Aware Platform

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      - run: pnpm lint
```

## Checklist

Before deployment:

- [ ] All API endpoints return proper responses
- [ ] Grid status updates every 15 seconds
- [ ] Jobs list updates every 10 seconds
- [ ] Priority inference works for all framework types
- [ ] Job execution completes with stdout/stderr
- [ ] Certificates generate as valid PDFs
- [ ] Errors are handled gracefully
- [ ] No console errors in DevTools
- [ ] Database connections stable
- [ ] Environment variables properly set
- [ ] Load test with 10+ concurrent jobs
- [ ] Performance audit passes
- [ ] Security tests pass

## Debugging Tips

### Enable verbose logging

Add to environment or code:
```typescript
console.log("[v0] API called:", endpoint)
console.log("[v0] Response:", data)
console.log("[v0] Error:", error)
```

### Check Supabase logs

1. Go to Supabase Dashboard
2. Check "Logs" section for:
   - Database connection errors
   - Failed queries
   - RLS policy violations

### Monitor Network Requests

1. Open DevTools → Network tab
2. Filter by XHR/fetch
3. Check:
   - Request headers and body
   - Response status and body
   - Timing information

### Database Inspection

```bash
# Connect to Supabase via psql
psql -h your-project.supabase.co -U postgres -d postgres

# List tables
\dt

# Query jobs
SELECT * FROM jobs LIMIT 5;

# Check grid history
SELECT * FROM grid_history ORDER BY timestamp DESC LIMIT 10;
```

Happy testing! 🧪
