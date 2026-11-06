-- Upgrade existing databases; new databases already include these in 01-schema.sql.
BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.password_reset_token (
    id_password_reset_token INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    creat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (expires_at > creat_at)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_id_user
    ON public.password_reset_token(id_user);

COMMIT;
