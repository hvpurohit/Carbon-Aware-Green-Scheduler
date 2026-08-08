def classify_job(execution_time_sec: int, memory_mb: int, cpu_cores: int, is_user_facing: bool = False) -> str:
    """
    Categorizes a job as 'low', 'medium', or 'high' priority based on specific resource 
    and execution attributes.
    
    These classifications map to the sustainability_policy.yaml:
    - Low (50 gCO2eq/kWh): Background tasks, data archival, non-urgent model retraining
    - Medium (150 gCO2eq/kWh): Daily reporting, batch processing
    - High (250 gCO2eq/kWh): Business-critical pipelines, user-facing async jobs
    """
    
    # 1. Immediate override for critical/user-facing jobs
    if is_user_facing:
        return "high"
        
    # 2. Evaluate resource consumption score
    # A simple heuristic combining time, memory, and compute power
    resource_score = (execution_time_sec * 0.05) + (memory_mb * 0.1) + (cpu_cores * 50)
    
    # 3. Apply thresholds
    if resource_score >= 5000:
        # Extremely resource-heavy jobs might be deemed high priority (or vice-versa depending on policy)
        # For this mock, we'll classify heavy batch jobs as 'medium' to ensure they run under decent conditions
        return "medium"
    elif resource_score >= 1000:
        # Moderate resource jobs like daily reports
        return "medium"
    else:
        # Lightweight or very long, non-urgent background tasks
        return "low"

import sqlite3

def init_db():
    conn = sqlite3.connect("classifier_jobs.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            time_sec INTEGER,
            mem_mb INTEGER,
            cpu INTEGER,
            user_facing BOOLEAN,
            priority TEXT
        )
    ''')
    conn.commit()
    return conn

def save_job_to_db(conn, job, priority):
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO jobs (name, time_sec, mem_mb, cpu, user_facing, priority)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (job["name"], job["time_sec"], job["mem_mb"], job["cpu"], job["user_facing"], priority))
    conn.commit()

def fetch_all_jobs(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT name, priority FROM jobs")
    return cursor.fetchall()

if __name__ == "__main__":
    # Initialize database
    conn = init_db()
    
    # Mock data to demonstrate classification against defined thresholds
    mock_jobs = [
        {"name": "Background Data Archival", "time_sec": 7200, "mem_mb": 512, "cpu": 1, "user_facing": False},
        {"name": "Nightly ML Retraining", "time_sec": 14400, "mem_mb": 8192, "cpu": 4, "user_facing": False},
        {"name": "Daily Sales Report", "time_sec": 600, "mem_mb": 2048, "cpu": 2, "user_facing": False},
        {"name": "Real-time Payment Proc", "time_sec": 5, "mem_mb": 256, "cpu": 2, "user_facing": True},
        {"name": "Small Cleanup Script", "time_sec": 30, "mem_mb": 128, "cpu": 1, "user_facing": False}
    ]
    
    print("--- Job Classification Demonstration ---")
    for job in mock_jobs:
        priority = classify_job(
            execution_time_sec=job["time_sec"],
            memory_mb=job["mem_mb"],
            cpu_cores=job["cpu"],
            is_user_facing=job["user_facing"]
        )
        print(f"Job: {job['name']:<26} | Computed Priority: {priority.upper()}")
        save_job_to_db(conn, job, priority)
        
    print("\n--- Saved Jobs in Database ---")
    saved_jobs = fetch_all_jobs(conn)
    for row in saved_jobs:
        print(f"Saved -> Name: {row[0]:<26} | Priority: {row[1].upper()}")
        
    conn.close()

