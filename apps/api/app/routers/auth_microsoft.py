import os

import msal
import requests
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from app.services.users_service import get_user_by_email, update_user
from core.security import create_access_token
from core.logging import logger


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")
TENANT_ID = os.getenv("MICROSOFT_TENANT_ID")
REDIRECT_URI = os.getenv("REDIRECT_URI")
CLIENT_URL = os.getenv(
    "CLIENT_URL",
    f"http://localhost:{os.getenv('CLIENT_PORT', '5173')}",
)
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES = ["User.Read"]


@router.get("/login/microsoft")
def microsoft_login():
    if not CLIENT_ID or not CLIENT_SECRET or not TENANT_ID or not REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La connexion Microsoft n'est pas configurée.",
        )

    microsoft_app = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET,
    )
    auth_url = microsoft_app.get_authorization_request_url(
        SCOPES,
        redirect_uri=REDIRECT_URI,
        prompt="select_account",
    )

    return RedirectResponse(auth_url)


@router.get("/callback/microsoft")
def callback(request: Request):
    code = request.query_params.get("code")
    if not code or not CLIENT_ID or not CLIENT_SECRET or not REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code d'autorisation Microsoft manquant.",
        )

    microsoft_app = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET,
    )
    token = microsoft_app.acquire_token_by_authorization_code(
        code,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

    if "error" in token or "access_token" not in token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=token.get(
                "error_description",
                "Connexion Microsoft refusée.",
            ),
        )

    graph_response = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {token['access_token']}"},
        timeout=10,
    )
    if not graph_response.ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Impossible de récupérer le profil Microsoft.",
        )

    user_info = graph_response.json()
    email = (user_info.get("mail") or user_info.get("userPrincipalName") or "").strip()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Microsoft n'a fourni aucune adresse email.",
        )

    user = get_user_by_email(email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur non autorisé ou non trouvé.",
        )

    jwt_token = create_access_token(
        {
            "id": str(user["id_user"]),
            "sub": str(user["id_user"]),
            "email": user["email"],
            "role": user["role"],
        }
    )

    # Set the access token as a cookie in the response
    # update last login for the user if needed
    try:
        update_user(user_id=user["id_user"], last_login="now()")
    except Exception as e:
        logger.error("Failed to update last login for username=%s: %s", email, str(e))

    response = RedirectResponse(
        f"{CLIENT_URL}/dashboard",
        status_code=status.HTTP_303_SEE_OTHER,
    )
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=False,
        samesite="lax",
    )
    return response
