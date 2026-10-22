import secrets
import string

ALPHABET = string.ascii_letters + string.digits


def generate_temporary_password(length: int = 12) -> str:
    while True:
        password = "".join(secrets.choice(ALPHABET) for _ in range(length))
        if (
                any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
        ):
            return password