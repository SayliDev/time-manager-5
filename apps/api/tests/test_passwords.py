"""Tests de l'utilitaire de hachage des mots de passe."""
import pytest

from app.core.passwords import hash_password, verify_password


def test_hash_is_not_plaintext_and_verifies():
    hashed = hash_password("Secret123")
    assert hashed != "Secret123"
    assert verify_password("Secret123", hashed) is True


def test_wrong_password_is_rejected():
    hashed = hash_password("Secret123")
    assert verify_password("Autre456", hashed) is False


def test_same_password_gives_different_hashes():
    assert hash_password("Secret123") != hash_password("Secret123")


def test_missing_or_invalid_hash_is_rejected():
    assert verify_password("Secret123", None) is False
    assert verify_password("Secret123", "") is False
    assert verify_password("Secret123", "pas-un-hash") is False


def test_too_long_password_raises():
    with pytest.raises(ValueError):
        hash_password("a" * 73)