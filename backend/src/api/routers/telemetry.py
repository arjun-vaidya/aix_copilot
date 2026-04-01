from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.core.security import get_current_user_id
from src.db.supabase import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

class IterationPayload(BaseModel):
    problem_id: str
    iteration_number: int
    code_snapshot: str
    objective_text: str
    constraint_text: str
    approach_text: str
    execution_mode: str
    execution_status: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None

@router.post("/")
def save_telemetry(payload: IterationPayload, user_id: str = Depends(get_current_user_id)):
    """
    Saves a student's code iteration to the database.
    """
    try:
        # Resolve the backend UUID for the problem based on the frontend's slug (e.g. "2")
        # Optimization: Try to match title or fallback to our seed ID
        problem_res = supabase.table("problem_sets").select("id").eq("title", payload.problem_id).execute()
        
        problem_uuid = (
            problem_res.data[0]["id"] 
            if problem_res.data 
            else "00000000-0000-0000-0000-000000000002" # Fallback to seed ID
        )

        data = {
            "student_id": user_id,
            "problem_id": problem_uuid,
            "iteration_number": payload.iteration_number,
            "code_snapshot": payload.code_snapshot,
            "objective_text": payload.objective_text,
            "constraint_text": payload.constraint_text,
            "approach_text": payload.approach_text,
            "execution_mode": payload.execution_mode,
            "execution_status": payload.execution_status,
            "stdout": payload.stdout,
            "stderr": payload.stderr
        }
        
        result = supabase.table("iterations").insert(data).execute()
        
        return {"status": "success", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
