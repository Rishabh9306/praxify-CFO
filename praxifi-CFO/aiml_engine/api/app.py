from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .endpoints import router as api_router

app = FastAPI(
    title="Agentic CFO Copilot API",
    description="An autonomous AIML system for financial intelligence, forecasting, and narrative generation.",
    version="1.0.0"
)

# Configure CORS with regex pattern to allow all Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|https://praxifi\.com|https://www\.praxifi\.com|https://api\.praxifi\.com|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include the API router from the endpoints file
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "Welcome to the Agentic CFO Copilot API",
        "documentation": "/docs"
    }