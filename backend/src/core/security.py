import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.config import settings

from jwt import PyJWKClient

security = HTTPBearer()

# Cache the JWK client to avoid repeated network calls
jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(jwks_url)

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Decodes and verifies the Supabase JWT.
    Supports both HS256 (symmetric secret) and ES256/RS256 (asymmetric JWKS).
    """
    token = credentials.credentials
    try:
        # 1. Inspect the header to see the algorithm
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        
        if alg == "HS256":
            # Symmetric verification using the project's JWT Secret
            payload = jwt.decode(
                token, 
                settings.SUPABASE_JWT_SECRET, 
                algorithms=["HS256"], 
                audience="authenticated"
            )
        else:
            # Asymmetric verification using the JWKS (Public Keys) from Supabase
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated"
            )
        return payload
    except jwt.ExpiredSignatureError as e:
        print(f"JWT Verification Failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Catch-all for algorithm mismatches, invalid signatures, or JWKS fetch failures
        print(f"JWT Verification Failed ({header.get('alg', 'UNK')}): {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
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
