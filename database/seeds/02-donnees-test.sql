BEGIN;

SET LOCAL TIME ZONE 'Europe/Paris';

DO $$
DECLARE
    v_first_names TEXT[] := ARRAY[
        'Alexandre', 'Alice', 'Karim', 'Emma', 'Lucas',
        'Chloe', 'Hugo', 'Lea', 'Nathan', 'Sarah, 'John'
    ];

    v_last_names TEXT[] := ARRAY[
        'Martin', 'Bernard', 'Dubois', 'Petit', 'Robert',
        'Richard', 'Durand', 'Moreau', 'Simon', 'Laurent, 'Doe'
    ];

    v_emails TEXT[] := ARRAY[
        'alexandre.martin.demo@example.com',
        'alice.bernard.demo@example.com',
        'karim.dubois.demo@example.com',
        'emma.petit.demo@example.com',
        'lucas.robert.demo@example.com',
        'chloe.richard.demo@example.com',
        'hugo.durand.demo@example.com',
        'lea.moreau.demo@example.com',
        'nathan.simon.demo@example.com',
        'sarah.laurent.demo@example.com',
        'john.doe.demo@example.com'
    ];

    v_user_ids INTEGER[] := ARRAY[]::INTEGER[];
    v_user_id INTEGER;

    v_it_department_id INTEGER;
    v_support_department_id INTEGER;

    v_dev_team_id INTEGER;
    v_support_team_id INTEGER;

    v_session_id INTEGER;
    v_late_session_id INTEGER;
    v_missing_clock_out_session_id INTEGER;

    v_user_index INTEGER;
    v_day_offset INTEGER;

    v_work_day DATE;
    v_work_mode TEXT;
    v_session_start TIMESTAMPTZ;
    v_session_end TIMESTAMPTZ;

BEGIN
    -- Empêche une deuxième insertion du même jeu de données.
    IF EXISTS (
        SELECT 1
        FROM public.users
        WHERE email = ANY(v_emails)
    ) THEN
        RAISE EXCEPTION
            'Jeu de test déjà présent ou email en conflit. Aucune donnée ajoutée.';
    END IF;

    -- 1 administrateur, 2 managers et 7 employés.
    FOR v_user_index IN 1..10 LOOP
        INSERT INTO public.users (
            first_name,
            last_name,
            email,
            password_hash,
            role,
            creat_at
        )
        VALUES (
            v_first_names[v_user_index],
            v_last_names[v_user_index],
            v_emails[v_user_index],
            NULL,
            CASE
                WHEN v_user_index = 1 THEN 'admin'
                WHEN v_user_index IN (2, 3) THEN 'manager'
                ELSE 'employe'
            END,
            TIMESTAMPTZ '2026-09-01 08:00:00+02'
        )
        RETURNING id_user INTO v_user_id;

        v_user_ids := array_append(v_user_ids, v_user_id);
    END LOOP;

    -- Départements.
    INSERT INTO public.departement (name)
    VALUES ('Informatique - DEMO')
    RETURNING id_departement INTO v_it_department_id;

    INSERT INTO public.departement (name)
    VALUES ('Services clients - DEMO')
    RETURNING id_departement INTO v_support_department_id;

    -- Alice dirige le développement.
    INSERT INTO public.team (
        name,
        description,
        id_user,
        id_departement
    )
    VALUES (
        'Développement - DEMO',
        'Équipe fictive de développement logiciel',
        v_user_ids[2],
        v_it_department_id
    )
    RETURNING id_team INTO v_dev_team_id;

    -- Karim dirige le support.
    INSERT INTO public.team (
        name,
        description,
        id_user,
        id_departement
    )
    VALUES (
        'Support - DEMO',
        'Équipe fictive de support technique',
        v_user_ids[3],
        v_support_department_id
    )
    RETURNING id_team INTO v_support_team_id;

    -- Les managers sont également membres de leur équipe.
    -- L'administrateur reste hors équipe.
    FOR v_user_index IN 2..10 LOOP
        INSERT INTO public.team_allocation (
            start_at,
            end_at,
            id_user,
            id_team
        )
        VALUES (
            DATE '2026-09-01',
            NULL,
            v_user_ids[v_user_index],
            CASE
                WHEN v_user_index IN (2, 4, 5, 6)
                    THEN v_dev_team_id
                ELSE v_support_team_id
            END
        );
    END LOOP;

    -- Contrats : Chloé en alternance, Sarah en CDD, les autres en CDI.
    FOR v_user_index IN 1..10 LOOP
        INSERT INTO public.contract (
            contract_type,
            start_date,
            end_date,
            id_user
        )
        VALUES (
            CASE
                WHEN v_user_index = 6 THEN 'Alternance'
                WHEN v_user_index = 10 THEN 'CDD'
                ELSE 'CDI'
            END,
            DATE '2026-09-01',
            CASE
                WHEN v_user_index = 6 THEN DATE '2028-08-31'
                WHEN v_user_index = 10 THEN DATE '2027-02-28'
                ELSE NULL
            END,
            v_user_ids[v_user_index]
        );
    END LOOP;

    -- Sessions du lundi 28 septembre au vendredi 2 octobre 2026.
    -- Journée standard : 09h–12h et 13h–17h, soit 7 heures.
    -- 10 utilisateurs × 5 jours × 2 sessions = 100 sessions.
    FOR v_user_index IN 1..10 LOOP
        FOR v_day_offset IN 0..4 LOOP
            v_work_day := DATE '2026-09-28' + v_day_offset;

            -- Alternate onsite/remote; keep the same mode all day.
            v_work_mode := CASE
                WHEN MOD(v_user_index + v_day_offset, 2) = 0 THEN 'onsite'
                ELSE 'remote'
            END;

            -- Matin.
            v_session_start :=
                (v_work_day + TIME '09:00')
                AT TIME ZONE 'Europe/Paris';

            v_session_end :=
                (v_work_day + TIME '12:00')
                AT TIME ZONE 'Europe/Paris';

            -- Emma arrive à 09h15 le mercredi.
            IF v_user_index = 4 AND v_day_offset = 2 THEN
                v_session_start :=
                    v_session_start + INTERVAL '15 minutes';
            END IF;

            INSERT INTO public.work_session (
                work_mode,
                start_at,
                end_at,
                creat_at,
                id_user
            )
            VALUES (
                v_work_mode,
                v_session_start,
                v_session_end,
                v_session_start,
                v_user_ids[v_user_index]
            )
            RETURNING id_work_session INTO v_session_id;

            IF v_user_index = 4 AND v_day_offset = 2 THEN
                v_late_session_id := v_session_id;
            END IF;

            -- Après-midi.
            v_session_start :=
                (v_work_day + TIME '13:00')
                AT TIME ZONE 'Europe/Paris';

            v_session_end :=
                (v_work_day + TIME '17:00')
                AT TIME ZONE 'Europe/Paris';

            -- Lucas travaille 30 minutes de plus chaque après-midi.
            IF v_user_index = 5 THEN
                v_session_end :=
                    v_session_end + INTERVAL '30 minutes';
            END IF;

            -- Sarah oublie de pointer sa sortie le vendredi.
            IF v_user_index = 10 AND v_day_offset = 4 THEN
                v_session_end := NULL;
            END IF;

            INSERT INTO public.work_session (
                work_mode,
                start_at,
                end_at,
                creat_at,
                id_user
            )
            VALUES (
                v_work_mode,
                v_session_start,
                v_session_end,
                v_session_start,
                v_user_ids[v_user_index]
            )
            RETURNING id_work_session INTO v_session_id;

            IF v_user_index = 10 AND v_day_offset = 4 THEN
                v_missing_clock_out_session_id := v_session_id;
            END IF;
        END LOOP;
    END LOOP;

    -- Corrections : celle d'Emma est refusée, celle de Sarah en attente.
    INSERT INTO public.timekeeping_correction (
        start_asked,
        end_asked,
        motif,
        status,
        process_by,
        id_work_session
    )
    VALUES
        (
            TIMESTAMPTZ '2026-09-30 09:00:00+02',
            TIMESTAMPTZ '2026-09-30 12:00:00+02',
            'Demande de modification de mon arrivée de 09h15 à 09h00.',
            'refusee',
            v_user_ids[2],
            v_late_session_id
        ),
        (
            TIMESTAMPTZ '2026-10-02 13:00:00+02',
            TIMESTAMPTZ '2026-10-02 17:00:00+02',
            'Oubli de pointage de sortie vendredi, départ à 17h00.',
            'en_attente',
            NULL,
            v_missing_clock_out_session_id
        );
END;
$$;

COMMIT;

-- Vérification des utilisateurs.
SELECT
    id_user,
    first_name,
    last_name,
    email,
    role
FROM public.users
WHERE email LIKE '%.demo@example.com'
ORDER BY id_user;

-- Total des heures terminées et nombre de sessions ouvertes.
-- Les sessions annulées sont exclues.
SELECT
    u.id_user,
    u.first_name,
    u.last_name,
    ROUND(
        COALESCE(
            SUM(EXTRACT(EPOCH FROM (s.end_at - s.start_at))),
            0
        ) / 3600,
        2
    ) AS completed_hours,
    COUNT(s.id_work_session) FILTER (
        WHERE s.end_at IS NULL
    ) AS open_sessions
FROM public.users u
LEFT JOIN public.work_session s
    ON s.id_user = u.id_user
    AND s.cancel_at IS NULL
    AND s.start_at >= TIMESTAMPTZ '2026-09-28 00:00:00+02'
    AND s.start_at < TIMESTAMPTZ '2026-10-05 00:00:00+02'
WHERE u.email LIKE '%.demo@example.com'
GROUP BY u.id_user, u.first_name, u.last_name
ORDER BY u.id_user;
