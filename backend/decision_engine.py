import yaml
import os

from green_check import get_current_carbon_intensity

POLICY_FILE = os.path.join(os.path.dirname(__file__), "sustainability_policy.yaml")

def load_policy():
    with open(POLICY_FILE, "r") as f:
        return yaml.safe_load(f)

def infer_priority(code: str) -> str:
    """
    Infers the priority of the workload based on its Python code content.
    """
    if not code:
        return "low"
    
    code_lower = code.lower()
    
    # High Priority: Web servers, real-time frameworks
    high_keywords = ['fastapi', 'flask', 'django', 'http.server', 'uvicorn', 'aiohttp']
    if any(kw in code_lower for kw in high_keywords):
        return "high"
        
    # Medium Priority: Heavy data processing, machine learning
    medium_keywords = ['pandas', 'numpy', 'torch', 'tensorflow', 'sklearn', 'scipy', 'matplotlib']
    if any(kw in code_lower for kw in medium_keywords):
        return "medium"
        
    # Low Priority: Default for simple scripts
    return "low"

def evaluate_decision(priority: str = "low"):
    """
    Evaluates if the job can run given the priority and current grid conditions.
    """
    policy = load_policy()
    
    if priority not in policy.get("priorities", {}):
        raise ValueError(f"Priority '{priority}' defined not found in policy.")
    
    threshold = policy["priorities"][priority]["max_carbon_intensity"]
    
    # Get current grid data
    grid_data = get_current_carbon_intensity()
    intensity = grid_data["intensity"]
    
    approved = intensity <= threshold
    
    decision = {
        "status": "APPROVED" if approved else "DENIED",
        "reason": f"Grid intensity is {intensity} gCO2eq/kWh. Threshold is {threshold}.",
        "grid_data": grid_data,
        "priority": priority,
        "threshold": threshold
    }
    
    return decision
