from fastapi import APIRouter, Depends
from app.controller.users import require_roles

router = APIRouter(
    prefix="/api",
    tags=["Manager"],
)
 
@router.get("/dashboard")
def admin_endpoint(
    # control access based on user roles
    user=Depends(require_roles("admin", "manager")),
):
    return {"message": "Welcome manager"}