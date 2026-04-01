import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.config import settings

security = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Decodes and verifies the Supabase JWT.
    Extracts the user ID and role for downstream endpoint scoping.
    """
    token = credentials.credentials
    try:
        # Supabase signs JWTs using the HS256 algorithm and the project's JWT Secret.
        # The 'aud' is typically 'authenticated'.
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_id(payload: dict = Depends(verify_jwt)) -> str:
    """Extracts the UUID from the verified JWT sub claim."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token",
        )
    return user_id
