from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .endpoints import router as api_router

app = FastAPI(
    title="Agentic CFO Copilot API",
    description="An autonomous AIML system for financial intelligence, forecasting, and narrative generation.",
    version="1.0.0"
)

# Configure CORS for production and development
# For production: Update these URLs with your actual domain
import os
ENV = os.getenv("ENV", "development")

if ENV == "production":
    # Production CORS - Update with your actual domain!
    ALLOWED_ORIGINS = [
        "https://praxifi.com",       
        "https://www.praxifi.com",   
        "https://api.praxifi.com",   
    ]
else:
    # Development CORS
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers (required for SSE)
)

# Include the API router from the endpoints file
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "Welcome to the Agentic CFO Copilot API",
        "documentation": "/docs"
    }