from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from src.core.security import get_current_user_id
from src.db.supabase import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

# Map the frontend's human-readable category labels to the DB's audit_category_enum values
CATEGORY_MAP = {
    "Syntax Error": "Syntax",
    "Logic Error": "Logic",
    "Hallucination": "Hallucination",
    "Unit Mismatch": "UnitMismatch",
}

class AuditPayload(BaseModel):
    iteration_id: str
    category: str
    student_rationale: str

@router.post("/")
def save_audit(payload: AuditPayload, user_id: str = Depends(get_current_user_id)):
    """
    Saves a manual audit record for a failed run.
    The student classifies the error and explains the root cause.
    """
    db_category = CATEGORY_MAP.get(payload.category)
    if not db_category:
        raise HTTPException(status_code=400, detail=f"Invalid category: {payload.category}")

    try:
        data = {
            "iteration_id": payload.iteration_id,
            "category": db_category,
            "student_rationale": payload.student_rationale,
        }
        result = supabase.table("manual_audits").insert(data).execute()
        return {"status": "success", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
