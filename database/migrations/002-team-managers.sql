BEGIN;

-- team.id_user remains the primary manager. Additional managers have the same
-- read scope for that team without replacing its existing primary manager.
CREATE TABLE IF NOT EXISTS public.team_manager (
    id_team INTEGER NOT NULL REFERENCES public.team(id_team) ON DELETE CASCADE,
    id_user INTEGER NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
    PRIMARY KEY (id_team, id_user)
);

CREATE INDEX IF NOT EXISTS team_manager_user_idx ON public.team_manager (id_user);

COMMIT;
