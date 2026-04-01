from fastapi import APIRouter, Depends
from src.core.security import verify_jwt, get_current_user_id

router = APIRouter()

@router.get("/me")
def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Test endpoint to verify that the request contains a valid Supabase JWT.
    """
    return {"status": "authenticated", "user_id": user_id}
