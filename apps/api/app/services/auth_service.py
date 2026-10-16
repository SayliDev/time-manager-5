from core.passwords import verify_password
from core.logging import logger

#Vérifie si le mot de passe en clair correspond au hash
def check_password(plain_password: str, hashed_password: str) -> bool:
    return verify_password(plain_password, hashed_password)