from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .endpoints import router as api_router
from .tax_routes import router as tax_router

app = FastAPI(
    title="Agentic CFO Copilot API",
    description="An autonomous AIML system for financial intelligence, forecasting, and narrative generation.",
    version="1.0.0"
)

# Configure CORS — reads ALLOWED_ORIGINS env var (comma-separated) or falls back to defaults
import os

_extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

ENV = os.getenv("ENV", "development")

if ENV == "production":
    ALLOWED_ORIGINS = [
        "https://praxifi.com",
        "https://www.praxifi.com",
        "https://api.praxifi.com",
    ] + _extra_origins
else:
    ALLOWED_ORIGINS = [
        "*",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.ngrok-free.app",
        "https://*.ngrok.io",
    ] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # Changed to False for wildcard origins
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers including Authorization
    expose_headers=["*"],  # Expose all headers (required for SSE)
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Include the API router from the endpoints file
app.include_router(api_router, prefix="/api")

# Include the TaxIQ router
app.include_router(tax_router)

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "Welcome to the Agentic CFO Copilot API with TaxIQ - GST & Tax Intelligence Engine",
        "documentation": "/docs",
        "features": {
            "financial_intelligence": "/api/*",
            "tax_intelligence": "/api/tax/*"
        }
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