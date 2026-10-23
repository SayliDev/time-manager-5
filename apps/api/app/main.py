"""FastAPI application entry point."""

import logging
import os
import psycopg
from fastapi import (Depends,FastAPI,HTTPException,status,)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (OAuth2PasswordBearer,)
from jose import JWTError
from core.security import decode_access_token
from app.routers.users_routers import router as users_router
from app.routers.register import router as register_router
from app.routers.auth_routers import router as auth_router
from app.routers.auth_microsoft import router as microsoft_auth_router
# from app.routers.register_routers import router as register_router
from app.routers.manager_router import router as manager_router
from app.routers.timekeeping_router import router as timekeeping_router

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
app.include_router(manager_router)
app.include_router(timekeeping_router)
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

# Route utilisée par Swagger pour récupérer un token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="api/auth/login"
)

# -----------------------------------------------------------------------------
# Base de données
# -----------------------------------------------------------------------------

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
