from psycopg.errors import UniqueViolation

from app.repositories.users_repository import create_User, get_by_id, get_all, update_User, deactivate_User
from core.security import hash_password

def create_user(
    *,
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    role: str = "employe",
    phone: str | None = None,
):
    # Crée un utilisateur en hachant le mot de passe avant de le stocker en bdd via createUser repository function
    try:
        return create_User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hash_password(password),
            role=role,
            phone=phone,
        )

    except UniqueViolation:
        raise ValueError(
            "Un utilisateur avec cet email existe déjà."
        )

def get_user_by_id(*,user_id: int,):
    try:
        return get_by_id(record_id=user_id)
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la récupération de l'utilisateur : {e}")

def get_all_users():
    try:
        return get_all()
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la récupération de tous les utilisateurs : {e}")

def update_user(
    *,
    user_id: int,
    first_name: str | None = None,
    last_name: str | None = None,
    email: str | None = None,
    password: str | None = None,
    role: str | None = None,
    phone: str | None = None,
):
    
    try:
        return update_User(
            record_id=user_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hash_password(password) if password else None,
            role=role,
            phone=phone,
        )
    except UniqueViolation:
        raise ValueError(
            "Un utilisateur avec cet email existe déjà."
        )
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la mise à jour de l'utilisateur : {e}")

def deactivate_user(*,user_id: int,):
    try:
        return deactivate_User(record_id=user_id)
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la désactivation de l'utilisateur : {e}")