"""FastAPI application entry point."""

import logging
import os
from typing import Any

import psycopg
from fastapi import (Depends,FastAPI,HTTPException,)
from fastapi.middleware.cors import CORSMiddleware
from app.dependencies import get_current_user
from app.routers.users_routers import UserResponse, router as users_router
from app.routers.register import router as register_router
from app.routers.auth_routers import router as auth_router
from app.routers.auth_microsoft import router as microsoft_auth_router
# from app.routers.register_routers import router as register_router

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------

CLIENT_PORT = os.getenv("CLIENT_PORT", "5173")

app = FastAPI(
    title="Time Manager API",
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True
    },
)

# autorise les origines CORS, autoorise response from backend to frontend (avoid browzer blocking)
# because docker backend and frontend different ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://localhost:{CLIENT_PORT}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Include router
# ----------------------------------------------------------------------------- 
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(microsoft_auth_router)
# app.include_router(register_router)
app.include_router(register_router)
from app.routers.time import router as time_router
from app.routers.kpi import router as kpi_router
from app.routers.teams import router as teams_router
app.include_router(time_router)
app.include_router(kpi_router)
app.include_router(teams_router)
# -----------------------------------------------------------------------------
# Constantes
# -----------------------------------------------------------------------------

TABLES = (
    "users",
    "departement",
    "team",
    "team_allocation",
    "contract",
    "work_session",
    "timekeeping_correction",
)

# -----------------------------------------------------------------------------
# Routes publiques
# -----------------------------------------------------------------------------

@app.get("/", tags=["system"])
def accueil():
    return {
        "message": "Time Manager fonctionne",
        "verification": "/health",
        "documentation": "/docs",
    }

# -----------------------------------------------------------------------------
# Routes sécurisées
# -----------------------------------------------------------------------------

@app.get("/me",
    tags=["Authentication"],
    response_model=UserResponse,
)
def me(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Profil de l'utilisateur connecté (sans hash de mot de passe)."""
    return current_user
