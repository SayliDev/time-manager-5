from core.security import create_access_token, decode_access_token


def test_access_token_round_trip() -> None:
    token = create_access_token({"sub": "admin"})

    assert decode_access_token(token)["sub"] == "admin"