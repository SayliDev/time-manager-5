from core.password_generator import generate_temporary_password


def test_password_has_required_length_and_character_types():
    password = generate_temporary_password()
    assert len(password) == 12
    assert any(c.islower() for c in password)
    assert any(c.isupper() for c in password)
    assert any(c.isdigit() for c in password)


def test_passwords_are_different():
    assert generate_temporary_password() != generate_temporary_password()