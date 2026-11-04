-- Full October 2026 demo: 22 weekdays, 11 users, morning/afternoon.
-- Existing sessions (including corrections and absence scenarios) are preserved.
-- Future sessions are fictional test data; dashboard queries exclude them
-- until their start time and the selected reference date have been reached.
-- Rerunning this script fills missing half-days without duplicating sessions.
BEGIN;

WITH profiles(email, user_number) AS (
    VALUES
        ('alexandre.martin.demo@example.com', 1),
        ('alice.bernard.demo@example.com', 2),
        ('karim.dubois.demo@example.com', 3),
        ('emma.petit.demo@example.com', 4),
        ('lucas.robert.demo@example.com', 5),
        ('chloe.richard.demo@example.com', 6),
        ('hugo.durand.demo@example.com', 7),
        ('lea.moreau.demo@example.com', 8),
        ('nathan.simon.demo@example.com', 9),
        ('sarah.laurent.demo@example.com', 10),
        ('john.doe.demo@example.com', 11)
),
workdays AS (
    SELECT
        DATE '2026-10-01' + day_offset AS work_day,
        (DATE '2026-10-01' + day_offset - DATE '2026-09-28') / 7 AS week_number,
        EXTRACT(ISODOW FROM DATE '2026-10-01' + day_offset)::INTEGER AS weekday
    FROM generate_series(0, 30) AS days(day_offset)
    WHERE EXTRACT(ISODOW FROM DATE '2026-10-01' + day_offset) < 6
),
daily_profiles AS (
    SELECT
        u.id_user,
        d.work_day,
        CASE
            WHEN MOD(p.user_number + (d.work_day - DATE '2026-09-28'), 2) = 0
                THEN 'onsite'
            ELSE 'remote'
        END AS work_mode,
        CASE
            WHEN p.user_number = 9 THEN TIME '08:30'
            WHEN p.user_number = 4 AND d.weekday IN (2, 4)
                THEN TIME '09:00' + make_interval(mins => 15 * (1 + MOD(d.week_number + d.weekday, 3)))
            WHEN p.user_number = 3 AND d.work_day IN (DATE '2026-10-08', DATE '2026-10-20')
                THEN TIME '09:20'
            ELSE TIME '09:00'
        END AS morning_start,
        CASE
            WHEN p.user_number = 5
                THEN TIME '17:30' + make_interval(mins => 30 * MOD(d.week_number, 3))
            WHEN p.user_number = 9
                THEN TIME '18:00' + make_interval(mins => 15 * MOD(d.week_number, 2))
            WHEN p.user_number = 6
                THEN TIME '15:30' + make_interval(mins => 30 * MOD(d.week_number, 3))
            ELSE TIME '17:00'
        END AS afternoon_end,
        (
            (p.user_number = 7 AND d.weekday = 5)
            OR (p.user_number = 8 AND (
                d.weekday = 4 OR (d.weekday = 5 AND MOD(d.week_number, 2) = 0)
            ))
            OR (p.user_number = 3 AND d.work_day = DATE '2026-10-12')
        ) AS absent
    FROM profiles AS p
    JOIN public.users AS u ON u.email = p.email
    CROSS JOIN workdays AS d
),
schedules AS (
    SELECT
        d.id_user,
        d.work_day,
        d.work_mode,
        half.morning,
        (d.work_day + CASE
            WHEN half.morning THEN d.morning_start
            ELSE TIME '13:00'
        END) AT TIME ZONE 'Europe/Paris' AS start_at,
        (d.work_day + CASE
            WHEN half.morning THEN TIME '12:00'
            ELSE d.afternoon_end
        END) AT TIME ZONE 'Europe/Paris' AS end_at,
        CASE WHEN d.absent
            THEN (d.work_day + TIME '08:00') AT TIME ZONE 'Europe/Paris'
            ELSE NULL
        END AS cancel_at
    FROM daily_profiles AS d
    CROSS JOIN (VALUES (TRUE), (FALSE)) AS half(morning)
)
INSERT INTO public.work_session (
    id_user, work_mode, start_at, end_at, cancel_at, creat_at
)
SELECT
    n.id_user, n.work_mode, n.start_at, n.end_at, n.cancel_at, n.start_at
FROM schedules AS n
WHERE NOT EXISTS (
    SELECT 1
    FROM public.work_session AS s
    WHERE s.id_user = n.id_user
      AND s.start_at >= n.work_day::TIMESTAMP AT TIME ZONE 'Europe/Paris'
      AND s.start_at < (n.work_day + 1)::TIMESTAMP AT TIME ZONE 'Europe/Paris'
      AND ((s.start_at AT TIME ZONE 'Europe/Paris')::TIME < TIME '13:00') = n.morning
)
ORDER BY n.work_day, n.id_user, n.morning DESC;

COMMIT;
