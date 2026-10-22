"""FastAPI application entry point."""

import logging
import os
import psycopg
CLIENT_PORT = os.getenv("CLIENT_PORT", "5173")
from fastapi import (Depends,FastAPI,HTTPException,status,)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (OAuth2PasswordBearer,OAuth2PasswordRequestForm,)
from jose import JWTError
from psycopg import sql
from psycopg.rows import dict_row
from core.security import (create_access_token,decode_access_token,)
from app.routers.users_routers import router as users_router
from app.routers.register import router as register_router
from app.db.database_conn import DATABASE_URL
from app.routers.auth_routers import router as auth_router
from app.routers.auth_microsoft import router as microsoft_auth_router
from app.controller.users import get_current_user as get_authenticated_user
# from app.routers.register_routers import router as register_router
from app.db.database_conn import connexion

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------

CLIENT_PORT = os.getenv("CLIENT_PORT")

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
    "team_allocation",
    "contract",
    "work_session",
    "timekeeping_correction",
)

# Route utilisée par Swagger pour récupérer un token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="api/auth/login"
)

# -----------------------------------------------------------------------------
# Base de données
# -----------------------------------------------------------------------------
 
connexion()

# -----------------------------------------------------------------------------
# JWT
# -----------------------------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)

        username = payload.get("sub")
        role = payload.get("role")

        if username is None:
            raise credentials_exception

        return {
            "username": username,
            "role": role
        }

    except JWTError:
        raise credentials_exception

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
