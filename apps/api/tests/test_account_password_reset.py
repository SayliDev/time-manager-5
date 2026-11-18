"""Account reset authorization, token handling, and email failure behavior."""
import hashlib
from unittest.mock import patch

import pytest

from app.dependencies import get_current_user
from app.main import app
from app.services import password_reset_service as service

USER = {"id_user": 7, "email": "user@example.com", "first_name": "Marie", "role": "employe"}


def test_request_requires_authentication(client):
    assert client.post('/api/me/password-reset').status_code == 401


def test_request_uses_authenticated_account(client):
    app.dependency_overrides[get_current_user] = lambda: USER
    try:
        with patch('app.routers.password_reset.request_password_reset') as request:
            response = client.post('/api/me/password-reset', json={"id_user": 99})
        assert response.status_code == 202
        request.assert_called_once_with(user=USER)
    finally:
        app.dependency_overrides.clear()


def test_email_failure_returns_retryable_error(client):
    app.dependency_overrides[get_current_user] = lambda: USER
    try:
        with patch('app.routers.password_reset.request_password_reset', side_effect=RuntimeError('Envoi impossible')):
            assert client.post('/api/me/password-reset').status_code == 503
    finally:
        app.dependency_overrides.clear()


def test_only_token_hash_is_persisted():
    with patch.object(service.secrets, 'token_urlsafe', return_value='secret-token'), \
         patch.object(service, 'build_reset_url', return_value='https://example.com/reset-password?token=secret-token'), \
         patch.object(service.repository, 'create') as create, \
         patch.object(service, 'send_password_reset_email', return_value=True) as send:
        service.request_password_reset(user=USER)
    assert create.call_args.kwargs['user_id'] == 7
    assert create.call_args.kwargs['token_hash'] == hashlib.sha256(b'secret-token').hexdigest()
    assert create.call_args.kwargs['expires_at'].tzinfo is not None
    assert 'secret-token' in send.call_args.kwargs['reset_url']


def test_failed_email_removes_unusable_token():
    with patch.object(service, 'build_reset_url', return_value='https://example.com/reset'), \
         patch.object(service.repository, 'create'), \
         patch.object(service.repository, 'delete') as delete, \
         patch.object(service, 'send_password_reset_email', return_value=False):
        with pytest.raises(RuntimeError):
            service.request_password_reset(user=USER)
    delete.assert_called_once()


@pytest.mark.parametrize('password', ['short', 'é' * 37])
def test_password_policy_is_enforced_before_database_access(password):
    with patch.object(service.repository, 'consume') as consume:
        with pytest.raises(ValueError):
            service.reset_password(token='token', new_password=password)
    consume.assert_not_called()


def test_expired_or_used_token_is_rejected(client):
    with patch.object(service, 'hash_password', return_value='hash'), \
         patch.object(service.repository, 'consume', return_value=None):
        response = client.post('/api/auth/reset-password', json={"token": "used", "new_password": "new-password1"})
    assert response.status_code == 400


def test_reset_is_public_and_stores_password_hash(client):
    with patch.object(service, 'hash_password', return_value='argon2-hash'), \
         patch.object(service.repository, 'consume', return_value=USER) as consume:
        response = client.post('/api/auth/reset-password', json={"token": "valid", "new_password": "new-password1"})
    assert response.status_code == 200
    consume.assert_called_once_with(token_hash=hashlib.sha256(b'valid').hexdigest(), password_hash='argon2-hash')


def test_reset_email_contains_link_and_uses_smtp():
    from app.services.email_service import send_password_reset_email

    with patch('app.services.email_service.smtplib.SMTP') as smtp_class:
        assert send_password_reset_email(
            to_email=USER['email'], first_name=USER['first_name'],
            reset_url='https://example.com/reset-password?token=secret',
        ) is True
    message = smtp_class.return_value.__enter__.return_value.send_message.call_args.args[0]
    assert message['To'] == USER['email']
    assert 'https://example.com/reset-password?token=secret' in message.get_content()
    assert 'créé' not in message['Subject']
