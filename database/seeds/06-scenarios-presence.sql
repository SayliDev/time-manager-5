-- Demo reference: 09:00-12:00 / 13:00-17:00, Monday-Friday, 35 h/week.
-- Week: 2026-09-28 through 2026-10-02, Europe/Paris.
-- Emma: late Wednesday (+15 min) and Friday (+30 min), 34.25 h.
-- Lucas: 40 h; Nathan: 42.5 h; Chloe: 30 h.
-- Hugo: absent Friday, 28 h; Lea: absent Thursday-Friday, 21 h.
-- Sarah: missing Friday clock-out, 31 completed hours (existing correction).
-- Alexandre, Alice, Karim, John: 35 h.
-- Absence scenarios cancel the generated sessions; dashboard/hour queries
-- ignore them. No user/session deletion and no change to work modes.
-- This script can also be applied to an existing demo database and rerun.
BEGIN;

WITH profiles(email, morning_start, afternoon_end, absent_days) AS (
    VALUES
        ('alexandre.martin.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[]::DATE[]),
        ('alice.bernard.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[]::DATE[]),
        ('karim.dubois.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[]::DATE[]),
        ('emma.petit.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[]::DATE[]),
        ('lucas.robert.demo@example.com', TIME '09:00', TIME '18:00', ARRAY[]::DATE[]),
        ('chloe.richard.demo@example.com', TIME '09:00', TIME '16:00', ARRAY[]::DATE[]),
        ('hugo.durand.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[DATE '2026-10-02']),
        ('lea.moreau.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[DATE '2026-10-01', DATE '2026-10-02']),
        ('nathan.simon.demo@example.com', TIME '08:30', TIME '18:00', ARRAY[]::DATE[]),
        ('sarah.laurent.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[]::DATE[]),
        ('john.doe.demo@example.com', TIME '09:00', TIME '17:00', ARRAY[]::DATE[])
),
sessions AS (
    SELECT
        s.id_work_session,
        s.cancel_at,
        u.email,
        p.morning_start,
        p.afternoon_end,
        p.absent_days,
        (s.start_at AT TIME ZONE 'Europe/Paris')::DATE AS work_day,
        (s.start_at AT TIME ZONE 'Europe/Paris')::TIME < TIME '13:00' AS morning
    FROM public.work_session AS s
    JOIN public.users AS u ON u.id_user = s.id_user
    JOIN profiles AS p ON p.email = u.email
    WHERE s.start_at >= TIMESTAMPTZ '2026-09-28 00:00:00+02'
      AND s.start_at < TIMESTAMPTZ '2026-10-03 00:00:00+02'
),
schedules AS (
    SELECT
        id_work_session,
        (work_day + CASE
            WHEN NOT morning THEN TIME '13:00'
            WHEN email = 'emma.petit.demo@example.com'
                 AND work_day = DATE '2026-09-30' THEN TIME '09:15'
            WHEN email = 'emma.petit.demo@example.com'
                 AND work_day = DATE '2026-10-02' THEN TIME '09:30'
            ELSE morning_start
        END) AT TIME ZONE 'Europe/Paris' AS new_start,
        CASE
            WHEN email = 'sarah.laurent.demo@example.com'
                 AND work_day = DATE '2026-10-02' AND NOT morning THEN NULL
            ELSE (work_day + CASE
                WHEN morning THEN TIME '12:00'
                ELSE afternoon_end
            END) AT TIME ZONE 'Europe/Paris'
        END AS new_end,
        CASE
            WHEN work_day = ANY(absent_days)
                THEN (work_day + TIME '08:00') AT TIME ZONE 'Europe/Paris'
            ELSE cancel_at
        END AS new_cancel
    FROM sessions
)
UPDATE public.work_session AS s
SET
    start_at = n.new_start,
    end_at = n.new_end,
    creat_at = n.new_start,
    cancel_at = n.new_cancel
FROM schedules AS n
WHERE s.id_work_session = n.id_work_session
  AND ROW(s.start_at, s.end_at, s.creat_at, s.cancel_at)
      IS DISTINCT FROM ROW(n.new_start, n.new_end, n.new_start, n.new_cancel);

COMMIT;
