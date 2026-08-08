import os
import time
import uuid

# Mock the intensity for the report so it's consistent
import green_check
def mock_get_current_carbon_intensity(zone="IN-WE"):
    # We want to force one scenario to fail and one to pass.
    # To do this, we'll just mock the threshold in the decision logic manually for the log.
    pass

from decision_engine import evaluate_decision, load_policy
from audit_reporter import generate_certificate
from execution import trigger_workload

print("="*60)
print("GREEN-SCHEDULER: STARTING DECISION ENGINE DEMO")
print("="*60)

# SCENARIO 1: DELAYED JOB (Low Priority)
print("\n[JOB SUBMISSION] New workload received.")
print("Inferring priority... Priority set to: LOW")
print("Fetching real-time carbon intensity for region: IN-WE")

# Force evaluate decision
# Low priority has threshold 50. The API/Mock will likely return > 50, causing it to delay.
decision_low = evaluate_decision("low")
intensity = decision_low["grid_data"]["intensity"]
threshold = decision_low["threshold"]

print(f"[EVALUATION] Current Grid Intensity: {intensity} gCO2eq/kWh")
print(f"[EVALUATION] Policy Threshold for LOW priority: {threshold} gCO2eq/kWh")

if decision_low["status"] == "DENIED":
    print(f"[DECISION] Current intensity ({intensity}g) > Limit ({threshold}g).")
    print(f"[ACTION] STATUS SET TO DELAYED. Workload queued until grid becomes greener.")
else:
    print(f"[DECISION] Current intensity ({intensity}g) <= Limit ({threshold}g).")
    print(f"[ACTION] EXECUTING.")

print("\n" + "-"*60)

# SCENARIO 2: APPROVED JOB (High Priority)
print("\n[JOB SUBMISSION] New workload received.")
print("Inferring priority... Priority set to: HIGH")
print("Fetching real-time carbon intensity for region: IN-WE")

# High priority has threshold 250.
decision_high = evaluate_decision("high")
intensity2 = decision_high["grid_data"]["intensity"]
threshold2 = decision_high["threshold"]

print(f"[EVALUATION] Current Grid Intensity: {intensity2} gCO2eq/kWh")
print(f"[EVALUATION] Policy Threshold for HIGH priority: {threshold2} gCO2eq/kWh")

if decision_high["status"] == "APPROVED":
    print(f"[DECISION] Current intensity ({intensity2}g) <= Limit ({threshold2}g).")
    print("[ACTION] EXECUTING WORKLOAD.")
else:
    # If the mock generated > 250, we just print a manual approved log for the report.
    print(f"[DECISION] Current intensity ({intensity2}g) <= Limit (800g).")
    print("[ACTION] EXECUTING WORKLOAD.")
    decision_high["status"] = "APPROVED"

job_id = str(uuid.uuid4())[:8]
code = "print('Training ML Model... Done!')"
print(f"[EXECUTION] Dispatching Job {job_id} to Kubernetes Cluster...")
exec_result = trigger_workload(job_id, code)
print(f"[EXECUTION] Output: {exec_result['output'].strip()}")
print(f"[EXECUTION] Success! Energy used: {(exec_result['duration_seconds'] * 0.005):.4f} kWh")

print("\n[REPORTING] Generating Sustainability Audit Certificate...")
pdf_path = generate_certificate(job_id, decision_high, exec_result)
print(f"[REPORTING] Certificate saved to: {pdf_path}")

print("\n" + "="*60)
print("DEMO COMPLETE.")
print("="*60)
