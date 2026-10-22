BEGIN;

SET LOCAL TIME ZONE 'Europe/Paris';

WITH demo_users AS (
    SELECT
        id_user,
        ROW_NUMBER() OVER (ORDER BY id_user)::INTEGER AS user_number
    FROM public.users
    WHERE email LIKE '%.demo@example.com'
),
session_details AS (
    SELECT
        s.id_work_session,
        u.user_number,
        (s.start_at AT TIME ZONE 'Europe/Paris')::DATE AS work_date,

        -- Numéro du jour depuis le début du jeu de test.
        (
            (s.start_at AT TIME ZONE 'Europe/Paris')::DATE
            - date_trunc('week', CURRENT_DATE)::date
        ) AS day_number,

        -- Identification de la session du matin.
        (
            (s.start_at AT TIME ZONE 'Europe/Paris')::TIME
            < TIME '13:00'
        ) AS is_morning

    FROM public.work_session AS s
    JOIN demo_users AS u ON u.id_user = s.id_user

        WHERE (s.start_at AT TIME ZONE 'Europe/Paris')::DATE
              >= date_trunc('week', CURRENT_DATE)::date
          AND (s.start_at AT TIME ZONE 'Europe/Paris')::DATE
              < date_trunc('week', CURRENT_DATE)::date + 5
      AND s.end_at IS NOT NULL
      AND s.cancel_at IS NULL

      -- Conserve les scénarios de correction existants.
      AND NOT EXISTS (
          SELECT 1
          FROM public.timekeeping_correction AS c
          WHERE c.id_work_session = s.id_work_session
      )
),
new_schedules AS (
    SELECT
        id_work_session,

        (
            work_date
            + CASE
                WHEN is_morning THEN TIME '07:30'
                ELSE TIME '13:30'
              END
            + make_interval(
                mins => CASE
                    WHEN is_morning THEN
                        15 * MOD(user_number * 3 + day_number * 2, 9)
                    ELSE
                        15 * MOD(user_number * 2 + day_number * 3, 7)
                END
              )
        ) AT TIME ZONE 'Europe/Paris' AS new_start,

        make_interval(
            mins => CASE
                WHEN is_morning THEN
                    120 + 15 * MOD(user_number * 2 + day_number * 3, 7)
                ELSE
                    120 + 15 * MOD(user_number * 5 + day_number * 7, 13)
            END
        ) AS new_duration

    FROM session_details
)
UPDATE public.work_session AS s
SET
    start_at = n.new_start,
    end_at = n.new_start + n.new_duration,
    creat_at = n.new_start
FROM new_schedules AS n
WHERE s.id_work_session = n.id_work_session;

COMMIT;