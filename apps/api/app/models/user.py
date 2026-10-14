from datetime import datetime

class User:
    def __init__(self, id: int, username: str, email: str):
        self.id = id
        self.username = username
        self.email = email      
        self.is_active = True
        self.is_superuser = False
        self.is_verified = False
        self.created_at = None
        self.updated_at = None
        self.deleted_at = None
        self.role = None
        self.permissions = []
        self.profile = None
        self.last_login = None
        self.failed_login_attempts = 0
        self.locked_until = None
        self.password_reset_token = None
        self.password_reset_token_expires = None
        self.two_factor_enabled = False
        self.two_factor_secret = None
        self.api_token = None
        self.refresh_token = None
        self.last_password_change = None
        self.account_locked = False
        self.account_locked_until = None
        self.email_verified = False
        self.phone_verified = False
        self.address_verified = False
        self.identity_verified = False

    def get_full_name(self):
        return f"{self.username} ({self.email})"
    def is_account_locked(self):
        if self.account_locked:
            if self.account_locked_until and self.account_locked_until > datetime.now():
                return True
            else:
                self.account_locked = False
                self.account_locked_until = None
        return False    