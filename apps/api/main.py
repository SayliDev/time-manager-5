"""API locale de demonstration. Sans authentification, donnees fictives uniquement."""
import os
import logging

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Time Manager - verification locale")
TABLES = (
    "utilisateur", "depatement", "equipe", "affectation_equipe",
    "contrat", "session_travail", "correction_pointage",
)


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


@app.get("/")
def accueil():
    return {"message": "Time Manager fonctionne", "verification": "/health", "documentation": "/docs"}


@app.get("/health")
def verification():
    try:
        with connexion() as conn:
            counts = {}
            for table in TABLES:
                query = sql.SQL("SELECT COUNT(*) AS total FROM public.{}").format(sql.Identifier(table))
                counts[table] = conn.execute(query).fetchone()["total"]
        return {"status": "ok", "tables": counts}
    except psycopg.Error:
        logging.exception("Verification PostgreSQL impossible")
        raise HTTPException(status_code=503, detail="Base inaccessible ou schema incomplet : consulter les logs.")


@app.get("/utilisateurs")
def utilisateurs():
    with connexion() as conn:
        return conn.execute(
            "SELECT id_utilisateur, prenom, nom, email, role "
            "FROM public.utilisateur ORDER BY id_utilisateur"
        ).fetchall()
