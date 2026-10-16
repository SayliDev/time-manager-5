"""FastAPI application entry point."""

import logging
import psycopg

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
# from app.routers.register_routers import router as register_router
from app.routers.test_work_time import router as test_work_time_router

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------

app = FastAPI(
    title="Time Manager API",
    version="1.0.0",
    swagger_ui_parameters={
        "persistAuthorization": True
    },
)

# AI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


app.include_router(test_work_time_router)
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

# Route utilisée par Swagger pour récupérer un token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)

# -----------------------------------------------------------------------------
# Base de données
# -----------------------------------------------------------------------------

def connexion():
    return psycopg.connect(
        DATABASE_URL,
        connect_timeout=5,
        row_factory=dict_row,
    )

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

        if username is None:
            raise credentials_exception

        return username

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
)
def me(
    current_user: str = Depends(get_current_user),
):
    return {
        "username": current_user
    }
