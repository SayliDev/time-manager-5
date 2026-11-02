"""FastAPI application entry point."""

import logging
import os

import psycopg
from fastapi import (Depends,FastAPI,HTTPException,)
from fastapi.middleware.cors import CORSMiddleware
from psycopg import sql
from app.routers.users_routers import router as users_router
from app.routers.register import router as register_router
from app.routers.auth_routers import router as auth_router
from app.routers.auth_microsoft import router as microsoft_auth_router
from app.routers.leave_requests import router as leave_requests_router
from app.controller.users import get_current_user as get_authenticated_user
# from app.routers.register_routers import router as register_router
from app.db.database_conn import connexion

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://localhost:{os.getenv('CLIENT_PORT', '5173')}",
    ],
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
app.include_router(leave_requests_router)
# app.include_router(register_router)
app.include_router(register_router)
# app.include_router(test_work_time_router)
# -----------------------------------------------------------------------------
# Constantes
# -----------------------------------------------------------------------------

TABLES = (
    "users",
    "departement",
    "team",
    "team_department",
    "team_allocation",
    "contract",
    "work_session",
    "leave_request",
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


@app.get("/me", tags=["Authentication"])
def me(
    current_user: dict = Depends(get_authenticated_user),
):
    return {
        "username": current_user.get("sub"),
        "role": current_user.get("role"),
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
