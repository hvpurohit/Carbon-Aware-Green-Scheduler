import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "jobs.db")

def get_connection():
    return sqlite3.connect(DB_FILE)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            priority TEXT,
            code TEXT,
            status TEXT,
            decision TEXT,
            execution TEXT,
            report_path TEXT,
            inferred_imports TEXT,
            created_at TEXT,
            updated_at TEXT,
            execution_start_time TEXT,
            execution_end_time TEXT
        )
    ''')
    conn.commit()
    conn.close()

def _serialize_job(job: Dict[str, Any]) -> tuple:
    return (
        job["job_id"],
        job["priority"],
        job["code"],
        job["status"],
        json.dumps(job["decision"]) if job.get("decision") else None,
        json.dumps(job["execution"]) if job.get("execution") else None,
        job.get("report_path"),
        json.dumps(job.get("inferred_imports", [])),
        job["created_at"],
        job["updated_at"],
        job.get("execution_start_time"),
        job.get("execution_end_time")
    )

def _deserialize_job(row: tuple) -> Dict[str, Any]:
    return {
        "job_id": row[0],
        "priority": row[1],
        "code": row[2],
        "status": row[3],
        "decision": json.loads(row[4]) if row[4] else None,
        "execution": json.loads(row[5]) if row[5] else None,
        "report_path": row[6],
        "inferred_imports": json.loads(row[7]) if row[7] else [],
        "created_at": row[8],
        "updated_at": row[9],
        "execution_start_time": row[10],
        "execution_end_time": row[11]
    }

def save_job(job: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO jobs (
            job_id, priority, code, status, decision, execution, 
            report_path, inferred_imports, created_at, updated_at, 
            execution_start_time, execution_end_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
            status=excluded.status,
            decision=excluded.decision,
            execution=excluded.execution,
            report_path=excluded.report_path,
            updated_at=excluded.updated_at,
            execution_start_time=excluded.execution_start_time,
            execution_end_time=excluded.execution_end_time
    ''', _serialize_job(job))
    conn.commit()
    conn.close()

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM jobs WHERE job_id = ?', (job_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return _deserialize_job(row)
    return None

def get_all_jobs() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM jobs ORDER BY created_at ASC')
    rows = cursor.fetchall()
    conn.close()
    return [_deserialize_job(row) for row in rows]
