from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings
from src.api.routers import auth, telemetry, audits

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI4Numerics telemetry and instructor analytics.",
    version="1.0.0",
)

# Configure CORS for local development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for the prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])
app.include_router(audits.router, prefix="/api/audits", tags=["Audits"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}
