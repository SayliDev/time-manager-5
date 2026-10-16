"""API locale de demonstration. Sans authentification, donnees fictives uniquement."""
import psycopg
from psycopg import Connection
from psycopg.rows import DictRow,dict_row
from fastapi import FastAPI
import os

app = FastAPI(title="Time Manager - verification locale")
TABLES = (
    "users", "departement", "team", "team_allocation",
    "contrat", "work_session", "timekeeping_correction",
)

DATABASE_URL = (
f"postgresql://{os.getenv('POSTGRES_USER')}:"
f"{os.getenv('POSTGRES_PASSWORD')}@"
f"{os.getenv('POSTGRES_HOST')}:"
f"{os.getenv('POSTGRES_PORT')}/"
f"{os.getenv('POSTGRES_DB')}"
)

def connexion():
    return psycopg.connect(
        DATABASE_URL,
        connect_timeout=5,
        row_factory=dict_row,
    )

# Connection details are intentionally not logged because they contain credentials.
def get_connection() -> Connection[DictRow]:
    return Connection[DictRow].connect(
        host=os.getenv("POSTGRES_HOST", "db"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        row_factory=dict_row,
    )
