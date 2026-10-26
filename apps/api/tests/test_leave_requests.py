from contextlib import nullcontext

import pytest

from app.db.database_conn import get_connection
from app.repositories import leave_requests


@pytest.fixture
def leave_data(monkeypatch):
    """Run the real query against temporary tables, never application data."""
    with get_connection() as connection:
        with connection.transaction(force_rollback=True):
            connection.execute("""
                CREATE TEMP TABLE users (
                    id_user integer PRIMARY KEY,
                    first_name text,
                    last_name text,
                    email text,
                    role text
                );
                CREATE TEMP TABLE team (id_team integer PRIMARY KEY, name text);
                CREATE TEMP TABLE team_allocation (
                    id_user integer,
                    id_team integer,
                    start_at date,
                    end_at date
                );
                CREATE TEMP TABLE leave_request (
                    id_leave_request integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                    id_user integer,
                    processed_by integer,
                    processed_at timestamptz,
                    decision_comment text,
                    return_at timestamptz,
                    reason text,
                    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
                    status text,
                    leave_type text NOT NULL DEFAULT 'conge',
                    start_at timestamptz
                );
                INSERT INTO users (id_user, role) VALUES
                    (1, 'employe'), (2, 'employe'), (3, 'manager'),
                    (4, 'employe'), (5, 'employe');
                INSERT INTO team VALUES (10, 'A'), (20, 'B');
                INSERT INTO team_allocation VALUES
                    (2, 10, CURRENT_DATE, NULL),
                    (3, 10, CURRENT_DATE, NULL),
                    (4, 20, CURRENT_DATE, NULL),
                    (5, 10, CURRENT_DATE - 10, CURRENT_DATE - 1);
                INSERT INTO leave_request
                    (id_leave_request, id_user, status, start_at)
                OVERRIDING SYSTEM VALUE
                SELECT id_user, id_user, 'pending', CURRENT_TIMESTAMP
                FROM users;
                SELECT setval(
                    pg_get_serial_sequence('leave_request', 'id_leave_request'),
                    100
                );
            """)
            monkeypatch.setattr(
                leave_requests, "get_connection", lambda: nullcontext(connection)
            )
            yield


@pytest.mark.parametrize(
    ("filters", "expected_ids"),
    [
        ({}, [1, 2, 3, 4, 5]),
        ({"viewer_id": 2}, [2, 3]),
        ({"viewer_id": 2, "viewer_role": "employe"}, [2, 3]),
        ({"viewer_id": 3, "viewer_role": "manager"}, [2, 3]),
        ({"viewer_id": 1, "viewer_role": "employe"}, [1]),
        ({"viewer_id": 5, "viewer_role": "employe"}, [5]),
        ({"viewer_id": 2, "user_id": 2}, [2]),
        ({"viewer_id": 2, "user_id": 4}, []),
        ({"viewer_id": 2, "team_id": 20}, []),
        ({"team_id": 20}, [4]),
        ({"viewer_id": 1, "team_id": 10}, []),
        ({"viewer_id": 2, "viewer_role": "manager"}, [2]),
    ],
)
def test_get_all_visibility(leave_data, filters, expected_ids):
    requests = leave_requests.get_all(**filters)

    assert [request["id_leave_request"] for request in requests] == expected_ids
    assert all(
        {"id_user", "first_name", "last_name", "email", "team_id", "team_name",
         "processor_first_name", "processor_last_name"} <= request.keys()
        for request in requests
    )


@pytest.mark.parametrize("decision", ["approved", "rejected"])
@pytest.mark.parametrize("manager_id", [3, None])
def test_decide_request_persists_decision(leave_data, decision, manager_id):
    result = leave_requests.decide_request(
        request_id=2,
        manager_id=manager_id,
        status=decision,
        decision_comment="Decision test",
    )

    assert result["status"] == decision
    assert result["processed_by"] == manager_id
    assert result["processed_at"] is not None
    assert result["decision_comment"] == "Decision test"
    stored = leave_requests.get_for_user(2)[0]
    assert stored["status"] == decision
    assert leave_requests.decide_request(
        request_id=2,
        manager_id=manager_id,
        status="approved",
        decision_comment=None,
    ) is None


@pytest.mark.parametrize("request_id", [1, 3, 4, 5, 999])
def test_manager_cannot_decide_own_or_outside_team_request(leave_data, request_id):
    assert leave_requests.decide_request(
        request_id=request_id,
        manager_id=3,
        status="approved",
        decision_comment=None,
    ) is None


@pytest.mark.parametrize("role", ["manager", "admin"])
@pytest.mark.parametrize("decision", ["approved", "rejected"])
def test_decision_endpoint(client, leave_data, role, decision):
    from core.security import create_access_token

    token = create_access_token({"id": "3", "sub": "3", "role": role})
    response = client.patch(
        "/api/leave-requests/2",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": decision, "decision_comment": "Decision test"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == decision
    assert leave_requests.get_for_user(2)[0]["status"] == decision


@pytest.mark.parametrize(
    ("role", "request_id", "payload", "expected_status"),
    [
        ("employe", 2, {"status": "approved"}, 403),
        ("manager", 3, {"status": "approved"}, 409),
        ("manager", 4, {"status": "approved"}, 409),
        ("manager", 2, {"status": "rejected", "decision_comment": "  "}, 409),
        ("manager", 2, {"status": "pending"}, 422),
    ],
)
def test_decision_endpoint_rejects_invalid_action(
    client, leave_data, role, request_id, payload, expected_status
):
    from core.security import create_access_token

    token = create_access_token({"id": "3", "sub": "3", "role": role})
    response = client.patch(
        f"/api/leave-requests/{request_id}",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert response.status_code == expected_status
    assert leave_requests.get_for_user(2)[0]["status"] == "pending"


@pytest.mark.parametrize("leave_type", ["conge", "maladie", "rtt"])
def test_create_request_stores_leave_type(leave_data, leave_type):
    from datetime import datetime, timedelta, timezone

    start = datetime.now(timezone.utc) + timedelta(days=100)
    created = leave_requests.create_request(
        user_id=1,
        start_at=start,
        return_at=start + timedelta(days=1),
        reason=None,
        leave_type=leave_type,
    )

    assert created["leave_type"] == leave_type


@pytest.mark.parametrize(
    ("payload", "expected_status"),
    [
        ({"leave_type": "vacances"}, 422),
        ({}, 201),
        ({"leave_type": "rtt"}, 201),
    ],
)
def test_create_endpoint_validates_leave_type(
    client, leave_data, payload, expected_status
):
    from core.security import create_access_token

    token = create_access_token({"id": "1", "sub": "1", "role": "employe"})
    response = client.post(
        "/api/leave-requests",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "start_at": "2030-01-01T09:00:00Z",
            "return_at": "2030-01-02T09:00:00Z",
            **payload,
        },
    )

    assert response.status_code == expected_status
    if expected_status == 201:
        assert response.json()["leave_type"] == payload.get("leave_type", "conge")
