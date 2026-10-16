from psycopg.errors import UniqueViolation
from app.repositories.microsoft_repository import create_User_microsoft

def create_user_microsoft(
    *,
    oid: str | None = None,
    id_user: str,
    mail_microsoft: str,
):
    # Crée un utilisateur en hachant le mot de passe avant de le stocker en bdd via createUser repository function
    try:
        return create_User_microsoft(
            oid=oid,
            id_user=id_user,
            mail_microsoft=mail_microsoft,
        )

    except UniqueViolation:
        raise ValueError(
            "Un utilisateur avec cet email existe déjà."
        )