from psycopg.errors import UniqueViolation
import traceback
from app.repositories.users_repository import (
    create as repository_create,
    get_by_id,
    get_all,
    get_all_with_details,
    update as repository_update,
    deactivate as repository_deactivate,
    get_by_email as repository_get_by_email,
    get_password_hash_by_id as repository_get_password_hash_by_id,
    get_by_oid as repository_get_by_oid
)
from core.passwords import hash_password

def create_user(
    *,
    oid: str | None = None,
    first_name: str,
    last_name: str,
    email: str,
    password: str | None = None,
    role: str = "employe",
    phone: str | None = None,
):
    # Crée un utilisateur en hachant le mot de passe avant de le stocker en bdd via createUser repository function
    try:
        return repository_create(
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

def get_all_users_with_details():
    try:
        return get_all_with_details()
    except Exception as e:
        raise RuntimeError(
            f"Erreur lors de la récupération détaillée des utilisateurs : {e}"
        )

def update_user(
    *,
    user_id: int,
    first_name: str | None = None,
    last_name: str | None = None,
    email: str | None = None,
    password: str | None = None,
    role: str | None = None,
    phone: str | None = None,
    last_login: str | None = None,
):
    
    try:
        return repository_update(
            record_id=user_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hash_password(password) if password else None,
            role=role,
            phone=phone,
            last_login=last_login,
        )
    except UniqueViolation:
        raise ValueError(
            "Un utilisateur avec cet email existe déjà."
        )
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la mise à jour de l'utilisateur : {e}")

def deactivate_user(*,user_id: int,):
    try:
        return repository_deactivate(record_id=user_id)
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la désactivation de l'utilisateur : {e}")

def get_user_by_email(*, email: str):
    try:
        return repository_get_by_email(email=email)
    except Exception as e:
        traceback.print_exc()
        raise RuntimeError(f"Erreur lors de la récupération de l'utilisateur par email : {e}")

def get_password_hash_by_id(*, user_id: int):
    try:
        return repository_get_password_hash_by_id(record_id=user_id)
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la récupération du hash du mot de passe de l'utilisateur : {e}")

def get_user_by_oid(*, oid: str):
    try:
        return repository_get_by_oid(oid=oid)
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la récupération de l'utilisateur par oid : {e}")
