"""
TaxIQ Standalone API Server
For testing TaxIQ functionality without Redis/dependencies
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .tax_routes import router as tax_router

app = FastAPI(
    title="TaxIQ - Intelligent GST & Tax Engine",
    description="AI-powered GST compliance, ITC optimization, RCM detection, and tax intelligence platform for Indian businesses",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - Allow all origins for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include the TaxIQ router
app.include_router(tax_router)

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with TaxIQ information"""
    return {
        "message": "🚀 TaxIQ API is running!",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "ITC Recovery Analysis",
            "RCM Detection & Compliance",
            "Tax Optimization Scenarios",
            "Compliance Risk Dashboard",
            "GSTR-2A/2B Reconciliation"
        ],
        "docs": "/docs",
        "health_check": "/api/tax/health"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TaxIQ",
        "timestamp": "2025-12-10T00:00:00Z"
    }
