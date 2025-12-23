# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
from routers.auth import router as auth_router
from routers.vault import router as vault_router

load_dotenv()

app = FastAPI(title="ITVE Access Vault")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Create tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.add_middleware(
    CORSMiddleware,
    # Use the variable instead of hardcoded string
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(vault_router)

@app.get("/")
def read_root():
    return {"message": "Vault Backend is Running"}