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
    # Development CORS - Allow all origins for development with ngrok
    # Explicitly include localhost and ngrok domains
    ALLOWED_ORIGINS = [
        "*",  # Allow all for development
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.ngrok-free.dev",
        "https://*.ngrok.io",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # Changed to False for wildcard origins
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

# Explicit CORS preflight handler for ngrok compatibility
@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests explicitly for ngrok"""
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )