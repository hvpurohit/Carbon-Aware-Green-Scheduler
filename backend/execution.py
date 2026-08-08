import time
import subprocess
import os
import tempfile

def trigger_workload(job_id: str, code: str):
    """
    Executes the provided python code using subprocess.
    """
    print(f"[EXECUTION] Starting Job {job_id}...")
    start_time = time.time()
    
    fd, temp_file_path = tempfile.mkstemp(suffix=".py")
    try:
        with os.fdopen(fd, 'w') as f:
            f.write(code)
            
        result = subprocess.run(["python", temp_file_path], capture_output=True, text=True)
        
        output = result.stdout
        if result.stderr:
            output += f"\n[ERROR]\n{result.stderr}"
            
        status = "SUCCESS" if result.returncode == 0 else "FAILED"
    except Exception as e:
        status = "FAILED"
        output = str(e)
    finally:
        try:
            os.remove(temp_file_path)
        except OSError:
            pass

    duration_seconds = round(time.time() - start_time, 2)
    print(f"[EXECUTION] Job {job_id} completed with status {status} in {duration_seconds}s.")
    
    return {
        "job_id": job_id,
        "status": status,
        "duration_seconds": duration_seconds,
        "output": output
    }
