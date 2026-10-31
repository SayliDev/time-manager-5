-- Lucas: 36 completed hours by Thursday October 22 (1 hour above 35).
-- Demo week October 19-23: 09:00-12:00 and 13:00-19:00, 45 hours total.
-- Safe to rerun: set an absolute clock-out time on existing demo sessions.
BEGIN;

UPDATE public.work_session AS session
SET end_at = (
    (session.start_at AT TIME ZONE 'Europe/Paris')::DATE + TIME '19:00'
) AT TIME ZONE 'Europe/Paris'
FROM public.users AS employee
WHERE session.id_user = employee.id_user
  AND employee.email = 'lucas.robert.demo@example.com'
  AND session.cancel_at IS NULL
  AND session.end_at IS NOT NULL
  AND session.start_at >= TIMESTAMPTZ '2026-10-19 00:00:00+02'
  AND session.start_at < TIMESTAMPTZ '2026-10-24 00:00:00+02'
  AND (session.start_at AT TIME ZONE 'Europe/Paris')::TIME = TIME '13:00';

COMMIT;
