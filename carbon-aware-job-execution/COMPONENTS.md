# Component Documentation

## Overview

This document outlines all components, API routes, and utilities in the Carbon-Aware Execution Platform.

## Frontend Components

### Dashboard (`components/dashboard.tsx`)

**Type:** Client Component  
**State:** Yes (refreshTrigger)

Main orchestrator component. Manages refresh state and coordinates all dashboard sections.

```typescript
export function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  return (
    <div className="max-w-6xl mx-auto">
      <GridStatusWidget />
      <JobSubmissionForm onJobCreated={() => setRefreshTrigger(...)} />
      <JobsList refreshTrigger={refreshTrigger} />
      {/* Info cards */}
    </div>
  )
}
```

**Props:** None  
**Children:**
- GridStatusWidget
- JobSubmissionForm
- JobsList

---

### GridStatusWidget (`components/grid-status-widget.tsx`)

**Type:** Client Component  
**Polling:** Every 15 seconds

Displays real-time grid carbon intensity with color-coded visual indicator.

**Features:**
- Color-coded background (green < 100, yellow 100-200, orange 200-300, red > 300)
- Intensity bar indicator
- "Very Clean" / "Clean" / "Moderate" / "Dirty" labels
- Auto-refresh every 15 seconds
- Timestamp of last update

**Props:**
- None (fetches own data)

**State:**
- `gridStatus` - Current intensity data
- `loading` - Fetch state

**API:** `GET /api/grid-status`

```typescript
interface GridStatus {
  carbonIntensity: number
  timestamp: string
  unit: string
}
```

---

### JobSubmissionForm (`components/job-submission-form.tsx`)

**Type:** Client Component  
**State:** Yes (code, loading, error, success)

Code editor form for submitting Python jobs with framework detection info.

**Features:**
- Textarea for code input
- Real-time syntax highlighting (via CSS)
- Submit button with loading state
- Error/success messages
- Priority inference legend

**Props:**
- `onJobCreated`: Callback when job submitted successfully

**State:**
- `code` - User input
- `loading` - Submission state
- `error` - Error message
- `success` - Success confirmation

**API:** `POST /api/jobs`

**Request:**
```typescript
{ code: string }
```

**Response:**
```typescript
{
  id: string
  status: 'queued'
  priority: 'high' | 'medium' | 'low'
  max_carbon_intensity: number
  inferred_imports: string[]
  created_at: string
}
```

---

### JobsList (`components/jobs-list.tsx`)

**Type:** Client Component  
**Polling:** Every 10 seconds

Lists all submitted jobs with expandable details, status badges, and action buttons.

**Features:**
- Real-time status list (polled every 10s)
- Expandable job details
- Execute button (for queued jobs)
- Certificate download button (for completed jobs)
- Status badges (queued, executing, completed, failed, delayed)
- Priority badges (high, medium, low)
- Framework tags
- stdout/stderr preview
- Execution metrics

**Props:**
- `refreshTrigger: number` - Triggers refetch when changed

**State:**
- `jobs` - Array of job objects
- `loading` - Initial load state
- `expandedJobId` - Currently expanded job
- `executingJobId` - Job being executed

**API:** 
- `GET /api/jobs`
- `POST /api/jobs/[id]/execute`

**Job Object:**
```typescript
interface Job {
  id: string
  status: 'queued' | 'executing' | 'completed' | 'failed' | 'delayed'
  priority: 'high' | 'medium' | 'low'
  code: string
  inferred_imports: string[]
  stdout: string | null
  stderr: string | null
  grid_intensity_at_execution: number | null
  execution_start_time: string | null
  execution_end_time: string | null
  created_at: string
  updated_at: string
}
```

---

## Pages

### Home Page (`app/page.tsx`)

**Type:** Server Component  
**Layout:** Full width dashboard

Entry point that renders the Dashboard in a gradient background.

**Layout:**
```
<main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
  <Dashboard />
</main>
```

**Metadata:**
- Title: "Carbon-Aware Execution Platform"
- Description: "Run Python code when the grid is greenest"

---

### Certificate Page (`app/jobs/[id]/certificate/page.tsx`)

**Type:** Client Component  
**Route:** `/jobs/[id]/certificate`

Display and download green certificate for completed jobs.

**Features:**
- Job status and metadata display
- Grid carbon intensity visualization
- Execution timing details
- Detected frameworks list
- Output preview
- PDF download button
- Back navigation

**Props:**
- `params.id: string` - Job ID

**State:**
- `job` - Job data
- `loading` - Fetch state
- `downloading` - PDF generation state
- `error` - Error message

**API:**
- `GET /api/jobs` (to fetch job data)
- `GET /api/jobs/[id]/certificate` (to download PDF)

---

## API Routes

### POST `/api/jobs`

**Purpose:** Submit new Python code for execution

**Request:**
```json
{
  "code": "import pandas as pd\nprint(pd.__version__)"
}
```

**Process:**
1. Validate code string
2. Scan for imports to infer priority
3. Determine max_carbon_intensity based on detected frameworks
4. Insert into database with `queued` status
5. Return job object

**Response (201):**
```json
{
  "id": "uuid",
  "status": "queued",
  "code": "...",
  "priority": "medium",
  "max_carbon_intensity": 150,
  "inferred_imports": ["pandas"],
  "created_at": "ISO-8601-timestamp"
}
```

**Error (400/500):**
```json
{ "error": "error message" }
```

**Implementation:** `/app/api/jobs/route.ts`

---

### GET `/api/jobs`

**Purpose:** List all jobs

**Query Parameters:** None (future: pagination, filters)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "status": "completed",
    "priority": "high",
    "stdout": "...",
    "stderr": null,
    "grid_intensity_at_execution": 145.5,
    "execution_duration": 2.3,
    ...
  },
  ...
]
```

**Implementation:** `/app/api/jobs/route.ts`

---

### POST `/api/jobs/[id]/execute`

**Purpose:** Execute a queued job

**URL Parameters:**
- `id: string` - Job UUID

**Process:**
1. Fetch job from database
2. Verify status is `queued`
3. Fetch current grid intensity
4. Compare to job's `max_carbon_intensity`
5. If too dirty: mark as `delayed`, return
6. If clean: mark as `executing`
7. Write code to temp file
8. Execute via `python3` subprocess (30s timeout)
9. Capture stdout/stderr
10. Save results to database
11. Mark as `completed` or `failed`

**Response (200):**
```json
{
  "id": "uuid",
  "status": "completed",
  "stdout": "output here",
  "stderr": null,
  "grid_intensity_at_execution": 145.5,
  "execution_start_time": "ISO-8601",
  "execution_end_time": "ISO-8601",
  "executionDuration": 2.3
}
```

**Delayed Response (200):**
```json
{
  "id": "uuid",
  "status": "delayed",
  "message": "Grid too dirty (350 > 250)",
  "carbonIntensity": 350
}
```

**Error Responses:**
- `404` - Job not found
- `400` - Job not in queued status
- `500` - Execution error

**Implementation:** `/app/api/jobs/[id]/execute/route.ts`

---

### GET `/api/grid-status`

**Purpose:** Fetch current grid carbon intensity

**Process:**
1. Call ElectricityMaps API (or return mock if key missing)
2. Parse carbon intensity value
3. Store in `grid_history` table for tracking
4. Return current value

**Response (200):**
```json
{
  "carbonIntensity": 145.2,
  "timestamp": "2024-05-10T12:00:00Z",
  "unit": "gCO2eq/kWh"
}
```

**Error (503):**
```json
{ "error": "Unable to fetch carbon intensity data" }
```

**Implementation:** `/app/api/grid-status/route.ts`

**Environment Variable:**
- `ELECTRICITY_MAPS_API_KEY` (optional, uses mock if missing)

---

### GET `/api/jobs/[id]/certificate`

**Purpose:** Download green certificate PDF

**URL Parameters:**
- `id: string` - Job UUID

**Process:**
1. Fetch job from database
2. Generate PDF with PDFKit
3. Embed execution metadata
4. Return as downloadable PDF

**PDF Contents:**
- Header: "GREEN CERTIFICATE"
- Job ID and status
- Grid carbon intensity details
- Execution timing (start, end, duration)
- Detected frameworks
- Console output (truncated to 20 lines)
- Error messages if any
- Footer with generation timestamp

**Response (200):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="green-certificate-{id}.pdf"`

**Error (404):**
```json
{ "error": "Job not found" }
```

**Implementation:** `/app/api/jobs/[id]/certificate/route.ts`

---

## Utilities

### JobExecutor (`lib/job-executor.ts`)

**Purpose:** Optional background job executor for auto-executing queued jobs

**Usage:**
```typescript
import { jobExecutor } from '@/lib/job-executor'

// Start polling for jobs
jobExecutor.start()

// Stop polling
jobExecutor.stop()
```

**Features:**
- Polls every 30 seconds for queued jobs
- Respects max concurrent jobs (default: 2)
- Automatic retry on failure
- Minimal logging

**Configuration:**
```typescript
new JobExecutor({
  pollIntervalMs: 30000,
  maxConcurrentJobs: 2
})
```

---

### Supabase Client (`lib/supabase/client.ts`)

**Purpose:** Browser-side Supabase client initialization

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.from('jobs').select()
```

---

### Supabase Server (`lib/supabase/server.ts`)

**Purpose:** Server-side Supabase client initialization

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data } = await supabase.from('jobs').select()
```

---

## Database Schema

### Jobs Table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'queued',
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python',
  priority TEXT NOT NULL DEFAULT 'low',
  max_carbon_intensity INT NOT NULL DEFAULT 50,
  inferred_imports TEXT[] NOT NULL DEFAULT '{}',
  stdout TEXT,
  stderr TEXT,
  grid_intensity_at_execution FLOAT,
  execution_start_time TIMESTAMPTZ,
  execution_end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

---

### Grid History Table

```sql
CREATE TABLE grid_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carbon_intensity FLOAT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grid_history_timestamp ON grid_history(timestamp);
```

---

## Component Dependency Graph

```
app/page.tsx (Server)
└── components/dashboard.tsx (Client)
    ├── components/grid-status-widget.tsx (Client)
    │   └── API: GET /api/grid-status (15s poll)
    ├── components/job-submission-form.tsx (Client)
    │   └── API: POST /api/jobs
    └── components/jobs-list.tsx (Client)
        ├── API: GET /api/jobs (10s poll)
        ├── API: POST /api/jobs/[id]/execute
        └── Link to: /jobs/[id]/certificate

app/jobs/[id]/certificate/page.tsx (Client)
├── API: GET /api/jobs
└── API: GET /api/jobs/[id]/certificate (download PDF)
```

---

## Styling

### Design Tokens

Colors defined in `app/globals.css`:
- `--background` - Page background
- `--foreground` - Text color
- `--primary` - Button/link color
- `--destructive` - Error/danger color
- `--chart-1 through --chart-5` - Data visualization colors

### Tailwind Classes Used

- `bg-gradient-to-br` - Background gradients
- `text-balance` - Balanced text wrapping
- `flex`, `grid`, `gap-*` - Layout
- `text-sm`, `text-lg`, `text-xl` - Typography
- `rounded-lg`, `shadow-sm` - Visual polish
- `transition-colors`, `animate-spin` - Animations

---

## State Management

**Pattern:** React hooks (useState, useEffect)

**No global state management** (kept simple for MVP)

**Data Flow:**
1. Components fetch data from APIs
2. Each component manages own loading/error state
3. Parent passes refresh triggers to children
4. Database is single source of truth

**Future:** Consider Redux/Zustand if complexity grows

---

## Error Handling

**Frontend:**
- Try/catch in async functions
- Error state in components
- User-friendly error messages

**Backend:**
- NextResponse with status codes
- Console logging for debugging
- Graceful fallbacks (mock data if API fails)

**Database:**
- Parameterized queries prevent SQL injection
- Supabase handles connection pooling

---

## Performance Considerations

- **Polling Intervals:**
  - Grid: 15s (balance between freshness and load)
  - Jobs: 10s (responsive UX)

- **Code Execution:**
  - 30-second timeout prevents resource exhaustion
  - 10MB buffer limit for stdout/stderr
  - Temp files auto-cleaned

- **Database:**
  - Indexes on frequently filtered columns
  - Future: Add pagination for large job lists

---

## Security

- **Code Execution:**
  - Subprocess isolation
  - Timeout enforcement
  - No unrestricted file access

- **Database:**
  - Parameterized queries
  - Supabase RLS policies (future)
  - No sensitive data in URLs

- **Frontend:**
  - XSS protection via React
  - CSRF tokens via Supabase
  - Env vars not exposed

---

That's the complete component documentation! 🎉
