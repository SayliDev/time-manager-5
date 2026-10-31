-- Backfill existing demo sessions without replacing a mode already set.
-- New databases receive these values directly from 02-donnees-test.sql.
BEGIN;

WITH demo_users AS (
    SELECT
        id_user,
        ROW_NUMBER() OVER (ORDER BY id_user)::INTEGER AS user_number
    FROM public.users
    WHERE email LIKE '%.demo@example.com'
)
UPDATE public.work_session AS s
SET work_mode = CASE
    WHEN MOD(
        u.user_number
        + ((s.start_at AT TIME ZONE 'Europe/Paris')::DATE
           - DATE '2026-09-28'),
        2
    ) = 0 THEN 'onsite'
    ELSE 'remote'
END
FROM demo_users AS u
WHERE s.id_user = u.id_user
  AND s.start_at >= TIMESTAMPTZ '2026-09-28 00:00:00+02'
  AND s.start_at < TIMESTAMPTZ '2026-10-03 00:00:00+02'
  AND s.work_mode IS NULL;

COMMIT;
