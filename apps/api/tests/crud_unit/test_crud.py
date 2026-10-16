"""Tests des dernières versions des CRUD utilisant get_connection().

Chaque test commun est exécuté pour les sept modules.
Les cas attendus sont définis ici, indépendamment de MODIFIABLE_FIELDS.
"""
from datetime import date, datetime, timezone
import re

import pytest
from psycopg.errors import CheckViolation, ForeignKeyViolation, UniqueViolation


DAY = date(2026, 10, 13)
START = datetime(2026, 10, 13, 9, tzinfo=timezone.utc)
END = datetime(2026, 10, 13, 12, tzinfo=timezone.utc)
PUBLIC_USER_FIELDS = {
    "id_user", "first_name", "last_name", "email",
    "role", "phone", "creat_at", "desactive_at",
}

# Adaptez uniquement "module" si vos fichiers portent d'autres noms.
CASES = [
    dict(module="users_repository", table="users", pk="id_user",
         create=dict(first_name="Alice", last_name="Martin",
                     email="alice@example.com"),
         defaults=dict(password_hash=None, role="employe", phone=None),
         nullable="phone", change="first_name",
         protected="creat_at", wrapped_delete=False),
    dict(module="departement", table="departement", pk="id_departement",
         create=dict(name="Informatique"), defaults={},
         nullable="name", change="name",
         protected="id_departement", wrapped_delete=True),
    dict(module="contrat", table="contract", pk="id_contract",
         create=dict(start_date=DAY, id_user=4),
         defaults=dict(contract_type=None, end_date=None),
         nullable="end_date", change="contract_type",
         protected="id_contract", wrapped_delete=True),
    dict(module="team", table="team", pk="id_team",
         create=dict(name="Dev", id_user=2, id_departement=1),
         defaults=dict(description=None),
         nullable="description", change="name",
         protected="id_team", wrapped_delete=True),
    dict(module="team_allocations", table="team_allocation",
         pk="id_team_allocation",
         create=dict(id_user=4, id_team=2, start_at=DAY),
         defaults=dict(end_at=None),
         nullable="end_at", change="end_at",
         protected="id_team_allocation", wrapped_delete=False),
    dict(module="timekeeping_corrections", table="timekeeping_correction",
         pk="id_timekeeping_correction",
         create=dict(id_work_session=10),
         defaults=dict(start_asked=None, end_asked=None, motif=None,
                       status="en_attente", process_by=None),
         nullable="process_by", change="motif",
         protected="id_timekeeping_correction", wrapped_delete=False),
    dict(module="work_session", table="work_session", pk="id_work_session",
         create=dict(start_at=START, id_user=4),
         defaults=dict(end_at=None, cancel_at=None),
         nullable="end_at", change="end_at",
         protected="creat_at", wrapped_delete=True),
]


@pytest.fixture(params=CASES, ids=lambda case: case["module"])
def case(request):
    return request.param


@pytest.fixture
def crud(db, case):
    return db.load(case["module"])


def assert_table(query, keyword, table):
    table_pattern = rf'(?:"{re.escape(table)}"|{re.escape(table)})'
    schema_pattern = r'(?:(?:"public"|public)\s*\.\s*)?'

    pattern = (
        rf"\b{re.escape(keyword)}\s+"
        rf"{schema_pattern}{table_pattern}"
        rf"(?=\s|[();,]|$)"
    )

    assert re.search(pattern, query, flags=re.IGNORECASE), (
        f"Table attendue après {keyword!r} : {table!r}. "
        f"Requête reçue : {query}"
    )

def assert_public_projection(query):
    # Contrôle la projection SQL réellement demandée, pas seulement le mock.
    if " returning " in query:
        projection = query.rsplit(" returning ", 1)[1]
    else:
        projection = query.split("select ", 1)[1].split(" from ", 1)[0]
    fields = {part.strip().strip('"') for part in projection.split(",")}
    assert fields == PUBLIC_USER_FIELDS


@pytest.mark.parametrize("rows", [[], [{"example": "row1"}, {"example": "row2"}]],
                         ids=["empty", "populated"])
def test_get_all(crud, case, db, sql_text, check_context, rows):
    db.cursor.fetchall.return_value = rows
    assert crud.get_all() == rows
    db.cursor.execute.assert_called_once()
    query = sql_text(db)
    assert_table(query, "from", case["table"])
    assert "order by " + case["pk"] in query
    if case["module"] == "users_repositories":
        assert_public_projection(query)
    check_context(db)


@pytest.mark.parametrize("exists", [True, False], ids=["found", "missing"])
def test_get_by_id(crud, case, db, sql_text, check_context, exists):
    expected = {case["pk"]: 42} if exists else None
    db.cursor.fetchone.return_value = expected
    assert crud.get_by_id(42) == expected
    db.cursor.execute.assert_called_once()
    assert db.cursor.execute.call_args.args[1] == (42,)
    query = sql_text(db)
    assert_table(query, "from", case["table"])
    assert "where " + case["pk"] + " = %s" in query
    if case["module"] == "users_repositories":
        assert_public_projection(query)
    check_context(db)


def test_create_values_defaults_and_return(crud, case, db, sql_text, check_context):
    expected = {case["pk"]: 42, **case["create"], **case["defaults"]}
    if case["module"] == "users_repositories":
        expected.pop("password_hash")
    db.cursor.fetchone.return_value = expected
    assert crud.create(**case["create"]) == expected
    db.cursor.execute.assert_called_once()
    query = sql_text(db)
    assert_table(query, "into", case["table"])
    match = re.search(
    r'insert\s+into\s+[\w."]+\s*\((.*?)\)\s*values\s*\((.*?)\)',
    query,
    flags=re.IGNORECASE | re.DOTALL,
    )
    assert match is not None, f"INSERT non reconnu : {query}"
    columns = [name.strip() for name in match[1].split(",")]
    placeholders = [item.strip() for item in match[2].split(",")]
    params = db.cursor.execute.call_args.args[1]
    assert len(columns) == len(params)
    assert placeholders == ["%s"] * len(columns)
    assert dict(zip(columns, params)) == {**case["create"], **case["defaults"]}
    assert "returning " in query
    if case["module"] == "users_repositories":
        assert_public_projection(query)
    check_context(db)


def test_create_missing_return_raises(crud, case, db):
    db.cursor.fetchone.return_value = None
    with pytest.raises(RuntimeError):
        crud.create(**case["create"])


@pytest.mark.parametrize("exists", [True, False], ids=["found", "missing"])
def test_update_partial_and_parameterized(crud, case, db, sql_text, check_context, exists):
    # Une valeur ressemblant à du SQL doit rester un PARAMÈTRE.
    # Le mock ne valide pas le type métier des dates.
    value = "x'; DROP TABLE users; --"
    changes = {case["change"]: value}
    expected = {case["pk"]: 42, **changes} if exists else None
    db.cursor.fetchone.return_value = expected
    assert crud.update(42, **changes) == expected
    db.cursor.execute.assert_called_once()
    query = sql_text(db)
    assert_table(query, "update", case["table"])
    assert "where " + case["pk"] + " = %s" in query
    assert value.lower() not in query
    assignments = query.split(" set ", 1)[1].split(" where ", 1)[0]
    assert assignments == '"' + case["change"] + '" = %s'
    assert db.cursor.execute.call_args.args[1] == (value, 42)
    if case["module"] == "users_repositories":
        assert_public_projection(query)
    check_context(db)


def test_update_explicit_null(crud, case, db):
    crud.update(42, **{case["nullable"]: None})
    assert db.cursor.execute.call_args.args[1] == (None, 42)


def test_update_empty_rejected_before_connection(crud, db):
    with pytest.raises(ValueError):
        crud.update(42)
    db.factory.assert_not_called()


@pytest.mark.parametrize("bad_field", ["unknown_field", 'name"; DROP TABLE users; --'])
def test_update_unknown_field_rejected(crud, case, db, bad_field):
    with pytest.raises(ValueError):
        crud.update(42, **{case["change"]: "value", bad_field: "bad"})
    db.factory.assert_not_called()


def test_update_protected_field_rejected(crud, case, db):
    with pytest.raises(ValueError):
        crud.update(42, **{case["protected"]: 999})
    db.factory.assert_not_called()


@pytest.mark.parametrize("exists", [True, False], ids=["deleted", "missing"])
def test_delete(crud, case, db, sql_text, check_context, exists):
    db.cursor.fetchone.return_value = (42,) if exists else None
    assert crud.delete(42) is exists
    db.cursor.execute.assert_called_once()
    query = sql_text(db)
    assert_table(query, "from", case["table"])
    assert query.startswith("delete ")
    assert "where " + case["pk"] + " = %s" in query
    assert "returning " + case["pk"] in query
    assert db.cursor.execute.call_args.args[1] == (42,)
    check_context(db, dictionaries=False)


def test_delete_foreign_key_error(crud, case, db):
    error = ForeignKeyViolation("Référence existante")
    db.cursor.execute.side_effect = error
    expected_type = ValueError if case["wrapped_delete"] else ForeignKeyViolation
    with pytest.raises(expected_type) as caught:
        crud.delete(42)
    if case["wrapped_delete"]:
        assert caught.value.__cause__ is error
    else:
        assert caught.value is error
    assert db.connection.__exit__.call_args.args[1] is error


@pytest.mark.parametrize("operation", ["get_all", "get_by_id", "create", "update"])
def test_sql_error_is_propagated(crud, case, db, operation):
    error = CheckViolation("Erreur PostgreSQL simulée")
    db.cursor.execute.side_effect = error
    with pytest.raises(CheckViolation) as caught:
        if operation == "get_all":
            crud.get_all()
        elif operation == "get_by_id":
            crud.get_by_id(42)
        elif operation == "create":
            crud.create(**case["create"])
        else:
            crud.update(42, **{case["nullable"]: None})
    assert caught.value is error
    assert db.cursor.__exit__.call_args.args[1] is error
    assert db.connection.__exit__.call_args.args[1] is error


@pytest.mark.parametrize("operation", ["create", "update", "delete"])
def test_transaction_exit_error_not_hidden(crud, case, db, operation):
    # Par exemple une erreur différée au moment du commit.
    error = RuntimeError("Échec à la sortie du contexte de connexion")
    db.connection.__exit__.side_effect = error
    db.cursor.fetchone.return_value = {case["pk"]: 42}
    with pytest.raises(RuntimeError) as caught:
        if operation == "create":
            crud.create(**case["create"])
        elif operation == "update":
            crud.update(42, **{case["nullable"]: None})
        else:
            crud.delete(42)
    assert caught.value is error


@pytest.mark.parametrize("exists", [True, False], ids=["found", "missing"])
def test_users_deactivate(db, sql_text, check_context, exists):
    users = db.load("users_repository")
    expected = {"id_user": 42, "desactive_at": START} if exists else None
    db.cursor.fetchone.return_value = expected
    assert users.deactivate(42) == expected
    query = sql_text(db)
    assert_table(query, "update", "users")
    assert "coalesce(desactive_at, current_timestamp)" in query
    assert "where id_user = %s" in query
    assert db.cursor.execute.call_args.args[1] == (42,)
    assert_public_projection(query)
    check_context(db)


def test_users_deactivate_error(db):
    users = db.load("users_repository")
    error = RuntimeError("Erreur de connexion")
    db.cursor.execute.side_effect = error
    with pytest.raises(RuntimeError) as caught:
        users.deactivate(42)
    assert caught.value is error
    assert db.connection.__exit__.call_args.args[1] is error


def test_users_duplicate_email_propagated(db):
    users = db.load("users_repository")
    error = UniqueViolation("Email déjà utilisé")
    db.cursor.execute.side_effect = error
    with pytest.raises(UniqueViolation):
        users.create(first_name="Alice", last_name="Martin", email="a@example.com")


def test_users_create_hash_not_returned(db, sql_text):
    users = db.load("users_repository")
    db.cursor.fetchone.return_value = {"id_user": 42}
    users.create(first_name="Alice", last_name="Martin", email="a@example.com",
                 password_hash="HASH_TEST_NON_UTILISABLE", role="manager",
                 phone="0600000000")
    assert "HASH_TEST_NON_UTILISABLE" in db.cursor.execute.call_args.args[1]
    assert "hash_test_non_utilisable" not in sql_text(db)
    assert_public_projection(sql_text(db))


def test_users_update_hash_not_returned(db, sql_text):
    users = db.load("users_repository")
    users.update(42, password_hash="HASH_TEST_NON_UTILISABLE", role="employe")
    assert db.cursor.execute.call_args.args[1] == (
        "HASH_TEST_NON_UTILISABLE", "employe", 42,
    )
    assert_public_projection(sql_text(db))


def test_correction_create_explicit_values(db, sql_text):
    corrections = db.load("timekeeping_corrections")
    db.cursor.fetchone.return_value = {"id_timekeeping_correction": 42}
    corrections.create(id_work_session=10, start_asked=START, end_asked=END,
                       motif="Oubli", status="refusee", process_by=2)
    assert db.cursor.execute.call_args.args[1] == (
        START, END, "Oubli", "refusee", 2, 10,
    )
    assert_table(sql_text(db), "into", "timekeeping_correction")


def test_correction_update_does_not_edit_session(db, sql_text):
    corrections = db.load("timekeeping_corrections")
    corrections.update(42, status="refusee", process_by=2)
    db.cursor.execute.assert_called_once()
    assert_table(sql_text(db), "update", "timekeeping_correction")
    assert db.cursor.execute.call_args.args[1] == ("refusee", 2, 42)


def test_work_session_cancel_is_update(db, sql_text):
    sessions = db.load("work_session")
    sessions.update(42, cancel_at=END)
    assert_table(sql_text(db), "update", "work_session")
    assert '"cancel_at" = %s' in sql_text(db)
    assert db.cursor.execute.call_args.args[1] == (END, 42)

