-- Repair legacy demo databases where Sarah and John shared one display name.
-- Sarah keeps her ID, sessions, contract, allocation and correction request.
-- John gets a separate employee account and 50 sessions (Sep 28-Oct 30).
-- On a fresh database, the earlier seeds already create both users/sessions.
-- Safe to rerun; existing John sessions and profile details are preserved.
BEGIN;

UPDATE public.users
SET first_name = 'Sarah', last_name = 'Laurent'
WHERE email = 'sarah.laurent.demo@example.com'
  AND first_name = 'Sarah, John'
  AND last_name = 'Laurent, Doe';

INSERT INTO public.users (first_name, last_name, email, role, creat_at)
SELECT 'John', 'Doe', 'john.doe.demo@example.com', 'employe',
       TIMESTAMPTZ '2026-09-01 08:00:00+02'
WHERE EXISTS (
    SELECT 1 FROM public.users WHERE email = 'sarah.laurent.demo@example.com'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.team_allocation (start_at, end_at, id_user, id_team)
SELECT a.start_at, a.end_at, john.id_user, a.id_team
FROM public.users AS john
JOIN public.users AS sarah ON sarah.email = 'sarah.laurent.demo@example.com'
JOIN public.team_allocation AS a ON a.id_user = sarah.id_user
WHERE john.email = 'john.doe.demo@example.com'
  AND NOT EXISTS (
      SELECT 1 FROM public.team_allocation AS existing
      WHERE existing.id_user = john.id_user
        AND existing.id_team = a.id_team
        AND existing.start_at = a.start_at
  );

INSERT INTO public.contract (contract_type, start_date, end_date, id_user)
SELECT 'CDI', DATE '2026-09-01', NULL, u.id_user
FROM public.users AS u
WHERE u.email = 'john.doe.demo@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.contract AS c WHERE c.id_user = u.id_user);

WITH workdays AS (
    SELECT DATE '2026-09-28' + day_offset AS work_day
    FROM generate_series(0, 32) AS days(day_offset)
    WHERE EXTRACT(ISODOW FROM DATE '2026-09-28' + day_offset) < 6
),
schedules AS (
    SELECT
        u.id_user, d.work_day, half.morning,
        CASE WHEN MOD(11 + (d.work_day - DATE '2026-09-28'), 2) = 0
            THEN 'onsite' ELSE 'remote'
        END AS work_mode,
        (d.work_day + CASE WHEN half.morning THEN TIME '09:00' ELSE TIME '13:00' END)
            AT TIME ZONE 'Europe/Paris' AS start_at,
        (d.work_day + CASE WHEN half.morning THEN TIME '12:00' ELSE TIME '17:00' END)
            AT TIME ZONE 'Europe/Paris' AS end_at
    FROM public.users AS u
    CROSS JOIN workdays AS d
    CROSS JOIN (VALUES (TRUE), (FALSE)) AS half(morning)
    WHERE u.email = 'john.doe.demo@example.com'
)
INSERT INTO public.work_session (id_user, work_mode, start_at, end_at, creat_at)
SELECT n.id_user, n.work_mode, n.start_at, n.end_at, n.start_at
FROM schedules AS n
WHERE NOT EXISTS (
    SELECT 1 FROM public.work_session AS s
    WHERE s.id_user = n.id_user
      AND s.start_at >= n.work_day::TIMESTAMP AT TIME ZONE 'Europe/Paris'
      AND s.start_at < (n.work_day + 1)::TIMESTAMP AT TIME ZONE 'Europe/Paris'
      AND ((s.start_at AT TIME ZONE 'Europe/Paris')::TIME < TIME '13:00') = n.morning
)
ORDER BY n.work_day, n.morning DESC;

COMMIT;
