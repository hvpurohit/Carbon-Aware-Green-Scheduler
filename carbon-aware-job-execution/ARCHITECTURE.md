# Carbon-Aware Execution Platform

A sophisticated system for running Python code only when the power grid is cleanest, with automatic priority inference and green certificates.

## System Overview

### Core Components

1. **Grid Status Monitoring** - Real-time carbon intensity polling from ElectricityMaps API
2. **Job Management** - Queue, execute, and track Python code execution
3. **Smart Priority Inference** - Automatically detect framework imports and set execution thresholds
4. **Job Execution Engine** - Subprocess-based Python execution with output capture
5. **Green Certificates** - PDF generation documenting execution metrics and carbon data

## Architecture

### Backend (Next.js API Routes)

```
/api/grid-status     (GET)    - Fetch current grid carbon intensity
/api/jobs           (GET)    - List all jobs
/api/jobs           (POST)   - Submit new job with code
/api/jobs/[id]/execute (POST) - Execute a specific job
/api/jobs/[id]/certificate (GET) - Download Green Certificate PDF
```

### Database Schema

#### Jobs Table
```sql
- id: UUID (primary key)
- status: TEXT (queued, executing, completed, failed, delayed)
- code: TEXT (Python code to execute)
- priority: TEXT (high, medium, low)
- max_carbon_intensity: INT (gCO2eq/kWh threshold)
- inferred_imports: TEXT[] (detected frameworks)
- stdout/stderr: TEXT (execution output)
- grid_intensity_at_execution: FLOAT
- execution_start_time/end_time: TIMESTAMPTZ
- created_at/updated_at: TIMESTAMPTZ
```

#### Grid History Table
```sql
- id: UUID (primary key)
- carbon_intensity: FLOAT (gCO2eq/kWh)
- timestamp: TIMESTAMPTZ (when measured)
- created_at: TIMESTAMPTZ
```

### Frontend Components

- **Dashboard** - Main orchestrator (client component)
- **GridStatusWidget** - Real-time grid carbon intensity display
- **JobSubmissionForm** - Code editor and job submission
- **JobsList** - Live job status with details and controls
- **Certificate Page** - Green certificate preview and download

## Priority Inference System

The system automatically analyzes Python imports to determine execution priority:

### High Priority (250 gCO2eq/kWh)
- Web frameworks: `fastapi`, `flask`, `django`, `aiohttp`, `starlette`
- Real-time systems that should run ASAP

### Medium Priority (150 gCO2eq/kWh)
- Data/ML frameworks: `pandas`, `numpy`, `tensorflow`, `torch`, `sklearn`, `scipy`, `polars`
- Batch processing that can wait for cleaner grid

### Low Priority (50 gCO2eq/kWh)
- Simple scripts without detected frameworks
- Flexible workloads that can wait indefinitely

## Execution Flow

### Job Lifecycle

1. **Submission**
   - User submits Python code via frontend
   - Code is scanned for imports
   - Priority and threshold automatically set
   - Job stored with status `queued`

2. **Polling**
   - Frontend/backend periodically check:
     - Grid carbon intensity (15s intervals)
     - Job status (10s intervals)
   - Optional background executor can auto-execute queued jobs

3. **Execution Decision**
   - Compare current grid intensity to job's threshold
   - If grid is clean enough: execute immediately
   - If grid is dirty: mark as `delayed` and wait

4. **Execution**
   - Code written to temporary file
   - Python subprocess executes with timeout (30s)
   - stdout/stderr captured
   - Execution metrics recorded

5. **Completion**
   - Job marked `completed` or `failed`
   - Green Certificate can be generated
   - Metrics stored for reporting

## Key Features

### Real-Time Grid Monitoring
- Polls ElectricityMaps API for current grid carbon intensity
- Maintains historical data for trends
- Visual indicator: color-coded grid status (green/yellow/orange/red)

### Smart Job Scheduling
- Automatically defers low-priority work during peak emissions
- Prioritizes real-time systems even on dirty grids
- Configurable carbon thresholds per job

### Green Certificates
PDF reports include:
- Job ID and execution status
- Grid carbon intensity at execution time
- Execution duration and timing
- Detected frameworks/imports
- Console output from code execution
- Environmental impact metrics

### Polling Architecture
- **Grid Status**: Fetched every 15 seconds
- **Jobs List**: Updated every 10 seconds
- **Background Execution**: Optional 30-second polling interval
- Real-time UI updates via React hooks

## Configuration

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: ElectricityMaps API Key
# If not set, system uses mock data for demo purposes
ELECTRICITY_MAPS_API_KEY=your-api-key

# Optional: Dev Supabase Redirect
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Customization Points

1. **Grid Zone** - Change `zone: 'US-CA'` in `/api/grid-status` for different regions
2. **Priority Thresholds** - Modify values in `PRIORITY_MAP` in `/api/jobs/route.ts`
3. **Polling Intervals** - Adjust in GridStatusWidget, JobsList, and job-executor.ts
4. **Timeout/Buffer** - Change subprocess timeout (30s default) in `/api/jobs/[id]/execute/route.ts`

## Testing

### Manual Testing

1. **Submit a Job**
   ```python
   # Test with simple code
   print("Hello from carbon-aware execution!")
   
   # Test with detected framework
   import pandas as pd
   df = pd.DataFrame({'a': [1, 2, 3]})
   print(df)
   ```

2. **Monitor Grid Status**
   - Watch the grid widget update every 15 seconds
   - Check color coding for intensity levels

3. **Execute Jobs**
   - Click "Execute" button on queued job
   - Monitor status changes (queued → executing → completed)
   - Check stdout/stderr output

4. **Download Certificate**
   - Click "Certificate" button on completed job
   - Review PDF with execution metrics

### API Testing

```bash
# Submit a job
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"test\")"}'

# Fetch jobs
curl http://localhost:3000/api/jobs

# Get grid status
curl http://localhost:3000/api/grid-status

# Execute a job
curl -X POST http://localhost:3000/api/jobs/{id}/execute

# Download certificate
curl http://localhost:3000/api/jobs/{id}/certificate > cert.pdf
```

## Future Enhancements

- Multi-region support with zone selection
- User authentication and job history
- Scheduled execution with cron-like patterns
- Job dependencies and workflows
- Resource usage tracking (CPU, memory)
- Notifications via email/webhook
- Public carbon footprint dashboard
- Integration with CI/CD pipelines

## Deployment Notes

### Vercel Deployment
- Set environment variables in project settings
- Ensure Python 3 is available at runtime (may need custom buildpack)
- Consider using Edge Functions for grid status polling
- Use Vercel Cron for background job execution

### Docker Deployment
```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y python3
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

### Requirements
- Node.js 18+
- Python 3.6+
- Supabase PostgreSQL instance
- ElectricityMaps API key (optional - uses mock data if missing)

## Metrics & Monitoring

Track:
- Total jobs submitted
- Jobs executed vs. delayed
- Average grid carbon intensity
- Cumulative carbon savings from deferral
- Popular frameworks (from imports analysis)
- Average execution duration

## License

Built with v0
