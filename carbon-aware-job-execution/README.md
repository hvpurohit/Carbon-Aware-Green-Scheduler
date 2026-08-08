# ⚡ Carbon-Aware Execution Platform

A sophisticated full-stack application that runs Python code only when the power grid is cleanest. The system intelligently defers execution based on real-time carbon intensity data from ElectricityMaps API, automatically infers job priority from code imports, and generates green certificates documenting your environmental impact.

## 🌍 Why It Matters

Every kilojoule of electricity has a carbon cost that varies by second depending on your grid's energy mix. This platform enables you to:

- **Reduce Carbon Footprint** - Defer flexible workloads until renewable energy peaks
- **Smart Scheduling** - Automatically prioritize real-time systems while deferring batch jobs
- **Measurable Impact** - Get green certificates proving your carbon-conscious execution
- **Framework-Aware** - Automatically detect job type and set appropriate thresholds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, pnpm
- Python 3.6+
- Supabase project (free)

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Set up Supabase
# - Create project at supabase.com
# - Copy URL and anon key to .env.local

# 3. Start dev server
pnpm dev

# Open http://localhost:3000
```

See [SETUP.md](./SETUP.md) for detailed instructions.

## ✨ Key Features

### 1. Real-Time Grid Monitoring
- Polls ElectricityMaps API every 15 seconds
- Color-coded grid status: green (clean) → red (dirty)
- Historical tracking for trends
- Mock data support for testing (no API key needed)

### 2. Intelligent Priority Inference
Automatically analyzes Python imports to determine execution priority:

| Priority | Threshold | Frameworks |
|----------|-----------|-----------|
| **High** | 250 gCO2eq/kWh | fastapi, flask, django (real-time systems) |
| **Medium** | 150 gCO2eq/kWh | pandas, numpy, tensorflow (batch processing) |
| **Low** | 50 gCO2eq/kWh | Simple scripts (maximum deferral) |

### 3. Job Execution Engine
- Secure subprocess execution with timeouts
- Real-time stdout/stderr capture
- Execution metrics tracking (duration, grid intensity)
- Support for delayed execution when grid is dirty

### 4. Green Certificates
PDF documents including:
- Job execution status and ID
- Grid carbon intensity at execution
- Execution timing and duration
- Detected frameworks/imports
- Console output logs
- Environmental impact metrics

### 5. Live Dashboard
- Grid status widget with intensity trends
- Code submission with syntax highlighting
- Job list with real-time status updates
- Job details expansion with full output
- Certificate download buttons

## 📊 System Architecture

### Backend (Next.js API Routes)

```
POST   /api/jobs                - Submit code (auto-infers priority)
GET    /api/jobs                - List all jobs
POST   /api/jobs/[id]/execute   - Execute specific job
GET    /api/grid-status         - Current grid carbon intensity
GET    /api/jobs/[id]/certificate - Download green certificate PDF
```

### Frontend Components

```
Dashboard
├── GridStatusWidget       (polls every 15s)
├── JobSubmissionForm      (code editor)
└── JobsList               (polls every 10s)
    └── Job Details        (expandable)
```

### Database (Supabase PostgreSQL)

- **jobs** table - Job metadata, code, execution results
- **grid_history** table - Historical carbon intensity data

## 🎯 Job Lifecycle

1. **Submit** - User pastes Python code → system infers priority
2. **Queue** - Job stored with `queued` status
3. **Monitor** - Dashboard polls grid every 15s, jobs every 10s
4. **Decide** - System checks if grid is clean enough
5. **Execute** - If grid intensity < threshold: run code
6. **Report** - Capture output, save metrics, generate certificate
7. **Download** - Get PDF green certificate

## 🔧 Configuration

### Environment Variables

```env
# Required: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Real-time grid data
ELECTRICITY_MAPS_API_KEY=your-api-key  # From electricityMaps.com
```

### Customization

- **Grid Zone** - Edit `zone: 'US-CA'` in `/app/api/grid-status/route.ts`
- **Priority Rules** - Modify `PRIORITY_MAP` in `/app/api/jobs/route.ts`
- **Polling Intervals** - Adjust in component useEffect hooks
- **Execution Timeout** - Change `timeout: 30000` in execute route

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system design, database schema, feature overview
- **[SETUP.md](./SETUP.md)** - Step-by-step setup, troubleshooting, production deployment
- **[TESTING.md](./TESTING.md)** - Test code examples, API testing guide

## 🧪 Test It

### Simple Test
```python
print("Hello from the green grid!")
```

### Framework Detection (Medium Priority)
```python
import pandas as pd
df = pd.DataFrame({'carbon': [100, 150, 200]})
print(df.mean())
```

### Real-World Script
```python
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

for i in range(20):
    print(f"fib({i}) = {calculate_fibonacci(i)}")
```

## 🌐 Deployment

### Vercel (Recommended for Frontend)

```bash
# Connect to Vercel
vercel deploy
```

Set environment variables in Vercel dashboard.

**Note:** For Python execution on Vercel, you may need:
- Custom buildpack with Python
- Or integrate with external Python execution service (Lambda, Hugging Face, etc.)

### Docker (Full Stack)

```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y python3
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build
CMD ["pnpm", "start"]
```

### Railway/Heroku

Both support Node + Python natively.

## 📈 Metrics & Analytics

The system tracks:
- Total jobs submitted/executed/delayed
- Average grid carbon intensity
- Popular frameworks (from import analysis)
- Average execution duration
- Carbon savings from deferral

## 🔐 Security Considerations

- Code execution limited to 30-second timeout
- Python subprocess sandboxing (no unrestricted access)
- Database queries parameterized against SQL injection
- Supabase RLS policies (future enhancement for multi-user)
- Environment variables not exposed in frontend

## 🚧 Future Enhancements

- [ ] Multi-region support (pick grid zone)
- [ ] User authentication & job history
- [ ] Scheduled execution patterns
- [ ] Job dependencies/workflows
- [ ] Resource monitoring (CPU, memory)
- [ ] Slack/email notifications
- [ ] Public carbon footprint leaderboard
- [ ] CI/CD pipeline integration
- [ ] Advanced scheduling algorithms
- [ ] Machine learning for optimal execution windows

## 📝 API Examples

### Submit a Job
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"hello\")"}'
```

### Get Current Grid Status
```bash
curl http://localhost:3000/api/grid-status
# Returns: { carbonIntensity: 145, timestamp: "...", unit: "gCO2eq/kWh" }
```

### List All Jobs
```bash
curl http://localhost:3000/api/jobs
# Returns: [{ id: "...", status: "completed", code: "...", ... }]
```

### Execute a Job
```bash
curl -X POST http://localhost:3000/api/jobs/{id}/execute
```

### Download Certificate
```bash
curl http://localhost:3000/api/jobs/{id}/certificate > cert.pdf
```

## 🤝 Contributing

1. Clone the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use for commercial projects

## 🎓 Learn More

- [ElectricityMaps API Docs](https://api.electricityMaps.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Carbon Intensity Explained](https://en.wikipedia.org/wiki/Carbon_intensity)

## 🌱 Built with

- **Next.js 16** - React framework with API routes
- **Supabase** - PostgreSQL database
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **PDFKit** - PDF generation
- **Axios** - HTTP client
- **ElectricityMaps** - Real-time grid data

---

**Help build a greener internet! 🌍**

Every job deferred during peak emissions is a small victory for the planet. Share your green certificates and inspire others to code responsibly.
