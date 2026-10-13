"""API locale de demonstration. Sans authentification, donnees fictives uniquement."""
from psycopg import Connection
from psycopg.rows import DictRow,dict_row
from fastapi import FastAPI

app = FastAPI(title="Time Manager - verification locale")
TABLES = (
    "users", "departement", "team", "team_allocation",
    "contrat", "work_session", "timekeeping_correction",
)


def get_connection() -> Connection[DictRow]:
    return Connection[DictRow].connect(
        host="localhost",
        port=5432,
        dbname="nom_de_ta_base",
        user="ton_utilisateur",
        password="ton_mot_de_passe",
        row_factory=dict_row,
    )
