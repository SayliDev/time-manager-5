"""Database configuration boundary.

The concrete session factory can be introduced here when the SQLAlchemy model
layer is added; keeping it behind this module avoids leaking driver details.
"""

from app.core.config import settings


def database_url() -> str:
    return settings.database_url