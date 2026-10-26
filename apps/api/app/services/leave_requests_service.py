from datetime import datetime
from typing import Any

from app.repositories import leave_requests

LEAVE_TYPES = ("conge", "maladie", "rtt")


def create_leave_request(
    *,
    user_id: int,
    start_at: datetime,
    return_at: datetime,
    reason: str | None,
    leave_type: str = "conge",
) -> dict[str, Any]:
    if leave_type not in LEAVE_TYPES:
        raise ValueError("Type d'absence invalide.")
    if start_at.tzinfo is None or return_at.tzinfo is None:
        raise ValueError("Les dates doivent contenir un fuseau horaire.")
    if return_at <= start_at:
        raise ValueError("La date de retour doit suivre la date de départ.")
    return leave_requests.create_request(
        user_id=user_id,
        start_at=start_at,
        return_at=return_at,
        reason=reason,
        leave_type=leave_type,
    )


def decide_leave_request(
    *,
    request_id: int,
    manager_id: int | None,
    status: str,
    decision_comment: str | None,
) -> dict[str, Any]:
    if status == 'rejected' and not (decision_comment or '').strip():
        raise ValueError("Un motif est obligatoire pour refuser une demande.")

    request = leave_requests.decide_request(
        request_id=request_id,
        manager_id=manager_id,
        status=status,
        decision_comment=decision_comment,
    )
    if request is None:
        raise ValueError(
            "Demande inexistante, déjà traitée ou approbation de sa propre demande."
        )
    return request