"""FastAPI application entry point."""

import logging
import os

import psycopg

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm,
)
from jose import JWTError, jwt
from psycopg import sql
from psycopg.rows import dict_row

from core.security import (
    SECRET_KEY,
    ALGORITHM,
    create_access_token,
)

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
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
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
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

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

@app.post("/api/auth/login",
    tags=["Authentication"],
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    #TODO:
    # Exemple de connexion.
    # À remplacer par une vérification PostgreSQL
    # avec mot de passe hashé.

    if (
        form_data.username != "admin"
        or form_data.password != "admin"
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides",
        )

    access_token = create_access_token(
        {
            "sub": form_data.username
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
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

@app.get("/utilisateurs",
    tags=["Utilisateurs"],
)
def utilisateurs(
    current_user: str = Depends(get_current_user),
):
    with connexion() as conn:

        result = conn.execute(
            """
            SELECT
                id_utilisateur,
                prenom,
                nom,
                email,
                role
            FROM public.utilisateur
            ORDER BY id_utilisateur
            """
        )

        return result.fetchall()