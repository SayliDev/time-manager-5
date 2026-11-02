from datetime import datetime, timezone
from unittest.mock import Mock

from app.services import users_service


def test_update_user_forwards_only_supplied_fields(monkeypatch):
    repository_update = Mock(return_value={"id_user": 42})
    monkeypatch.setattr(users_service, "repository_update", repository_update)
    last_login = datetime(2026, 11, 2, 9, 47, tzinfo=timezone.utc)

    user = users_service.update_user(user_id=42, last_login=last_login)

    assert user == {"id_user": 42}
    repository_update.assert_called_once_with(
        record_id=42,
        last_login=last_login,
    )
