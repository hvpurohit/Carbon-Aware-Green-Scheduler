from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
import time
from typing import Dict, Any

from decision_engine import evaluate_decision, infer_priority
from execution import trigger_workload
from audit_reporter import generate_certificate
from green_check import get_current_carbon_intensity
from database import init_db, save_job, get_job as db_get_job, get_all_jobs

app = FastAPI(title="Green-Scheduler API")

@app.on_event("startup")
def startup_event():
    init_db()

# Allow CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobRequest(BaseModel):
    code: str = ""

def process_job(job_id: str, priority: str, code: str):
    job = db_get_job(job_id)
    if not job:
        return
        
    try:
        job["status"] = "queued"
        save_job(job)
        
        decision = evaluate_decision(priority)
        job["decision"] = decision
        save_job(job)
        
        if decision["status"] == "APPROVED":
            job["status"] = "executing"
            job["execution_start_time"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            save_job(job)
            
            # Execute workload
            exec_result = trigger_workload(job_id, code)
            job["execution"] = exec_result
            job["execution_end_time"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            save_job(job)
            
            # Generate Audit Report
            report_path = generate_certificate(job_id, decision, exec_result)
            job["report_path"] = report_path
            
            job["status"] = "completed"
        else:
            job["status"] = "delayed"
    except Exception as e:
        job["status"] = "failed"
        if not job["execution"]:
             job["execution"] = {"stdout": None, "stderr": str(e)}
        else:
             job["execution"]["stderr"] = str(e)
    finally:
        job["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        save_job(job)

def to_next_js_job(job):
    execution = job.get("execution") or {}
    decision = job.get("decision") or {}
    grid_data = decision.get("grid_data") or {}
    return {
        "id": job["job_id"],
        "status": job["status"],
        "priority": job["priority"],
        "code": job["code"],
        "inferred_imports": job.get("inferred_imports", []),
        "stdout": execution.get("stdout"),
        "stderr": execution.get("stderr"),
        "grid_intensity_at_execution": grid_data.get("intensity"),
        "execution_start_time": job.get("execution_start_time"),
        "execution_end_time": job.get("execution_end_time"),
        "created_at": job.get("created_at"),
        "updated_at": job.get("updated_at")
    }

@app.get("/api/grid-status")
def get_grid_status():
    """Returns the current mock grid status."""
    data = get_current_carbon_intensity()
    return {
        "carbonIntensity": data["intensity"],
        "timestamp": data["timestamp"],
        "unit": "gCO2eq/kWh"
    }

@app.post("/api/jobs")
def create_job(req: JobRequest, background_tasks: BackgroundTasks):
    priority = infer_priority(req.code)
    job_id = str(uuid.uuid4())[:8]
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    new_job = {
        "job_id": job_id,
        "priority": priority,
        "code": req.code,
        "status": "queued",
        "decision": None,
        "execution": None,
        "report_path": None,
        "inferred_imports": [],
        "created_at": now,
        "updated_at": now,
        "execution_start_time": None,
        "execution_end_time": None
    }
    save_job(new_job)
    
    # Do not execute automatically. Wait for POST /api/jobs/{job_id}/execute
    return to_next_js_job(new_job)

@app.post("/api/jobs/{job_id}/execute")
def execute_job(job_id: str, background_tasks: BackgroundTasks):
    job = db_get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Queue execution
    background_tasks.add_task(process_job, job_id, job["priority"], job["code"])
    return {"status": "started"}

@app.get("/api/jobs")
def list_jobs():
    # Return as list, sorted by newest
    jobs = get_all_jobs()
    return [to_next_js_job(job) for job in jobs[::-1]]

@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    job = db_get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return to_next_js_job(job)

@app.get("/api/jobs/{job_id}/certificate")
def download_report(job_id: str):
    job = db_get_job(job_id)
    if not job or not job.get("report_path"):
        raise HTTPException(status_code=404, detail="Report not generated")
    
    path = job["report_path"]
    if os.path.exists(path):
        return FileResponse(path, media_type="application/pdf", filename=f"Green_Certificate_{job_id}.pdf")
    raise HTTPException(status_code=404, detail="Report file missing")
