# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import database setup
from database import engine, Base

# Import the new Auth Router
# (Assumes you placed auth.py in the 'routers' folder as discussed)
from routers.auth import router as auth_router

# 1. Load environment variables
load_dotenv()

app = FastAPI(title="ITVE Access Vault")

# 2. Get Frontend URL from env (fallback to localhost for development)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Create tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Fix CORS
app.add_middleware(
    CORSMiddleware,
    # Use the variable instead of hardcoded string
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register the router
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Vault Backend is Running"}