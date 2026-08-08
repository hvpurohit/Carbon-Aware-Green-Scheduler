@echo off
echo Starting Green Scheduler Backend...
start cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload"

echo Starting Green Scheduler Frontend...
start cmd /k "cd carbon-aware-job-execution && npm run dev"

echo =========================================================
echo Both services are starting in separate windows!
echo Backend API will be available at http://localhost:8000
echo Frontend UI will be available at http://localhost:3000
echo =========================================================
pause
