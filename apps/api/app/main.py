"""FastAPI application entry point."""

import logging
import os
from typing import Any

import psycopg
from fastapi import (Depends,FastAPI,HTTPException,)
from fastapi.middleware.cors import CORSMiddleware
from psycopg import sql
from app.dependencies import get_current_user
from app.routers.users_routers import UserResponse, router as users_router
from app.routers.register import router as register_router
from app.routers.auth_routers import router as auth_router
from app.routers.auth_microsoft import router as microsoft_auth_router
# from app.routers.register_routers import router as register_router
from app.db.database_conn import connexion
from app.routers.password_reset import router as password_reset_router

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
app.include_router(password_reset_router)
app.include_router(register_router)
# app.include_router(test_work_time_router)
# -----------------------------------------------------------------------------
# Constantes
# -----------------------------------------------------------------------------

TABLES = (
    "utilisateur",
    "departement",
    "equipe",
    "affectation_equipe",
    "contrat",
    "session_travail",
    "correction_pointage",
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

@app.get("/health", tags=["system"])
def verification():

    try:
        with connexion() as conn:

            counts = {}

            for table in TABLES:

                query = sql.SQL(
                    "SELECT COUNT(*) AS total FROM public.{}"
                ).format(
                    sql.Identifier(table)
                )

                result = conn.execute(
                    query
                ).fetchone()

                counts[table] = result["total"]

        return {
            "status": "ok",
            "tables": counts,
        }

    except psycopg.Error:

        logging.exception(
            "Verification PostgreSQL impossible"
        )

        raise HTTPException(
            status_code=503,
            detail="Base inaccessible ou schéma incomplet.",
        )

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
