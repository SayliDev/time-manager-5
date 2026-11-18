BEGIN;

-- Keep in sync with migrations/002-team-managers.sql for fresh installations.
CREATE TABLE IF NOT EXISTS public.team_manager (
    id_team INTEGER NOT NULL REFERENCES public.team(id_team) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
    PRIMARY KEY (id_team, id_user)
);

CREATE INDEX IF NOT EXISTS team_manager_user_idx ON public.team_manager (id_user);

COMMIT;
