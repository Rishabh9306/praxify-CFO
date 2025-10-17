from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .endpoints import router as api_router
import os

app = FastAPI(
    title="Agentic CFO Copilot API",
    description="An autonomous AIML system for financial intelligence, forecasting, and narrative generation.",
    version="1.0.0"
)

# Configure CORS for frontend integration
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

# Print CORS configuration for debugging
print(f"🔧 CORS Configuration:")
print(f"   CORS_ORIGINS env: {cors_origins_str}")
print(f"   Parsed origins: {cors_origins}")
print(f"   Number of origins: {len(cors_origins)}")

# For development, allow all configured origins
# IMPORTANT: FastAPI CORSMiddleware needs exact origin matches
# TEMPORARY: Allow all origins for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily for debugging
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"✅ CORS middleware configured with origins: {cors_origins}")

# Include the API router from the endpoints file
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "Welcome to the Agentic CFO Copilot API",
        "documentation": "/docs"
    }