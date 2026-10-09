BEGIN;
SET LOCAL TIME ZONE 'Europe/Paris';

DO $$
DECLARE
    first_names TEXT[] := ARRAY[
        'Alexandre', 'Alice', 'Karim', 'Emma', 'Lucas',
        'Chloe', 'Hugo', 'Lea', 'Nathan', 'Sarah'
    ];

    last_names TEXT[] := ARRAY[
        'Martin', 'Bernard', 'Dubois', 'Petit', 'Robert',
        'Richard', 'Durand', 'Moreau', 'Simon', 'Laurent'
    ];

    emails TEXT[] := ARRAY[
        'alexandre.martin.demo@example.com',
        'alice.bernard.demo@example.com',
        'karim.dubois.demo@example.com',
        'emma.petit.demo@example.com',
        'lucas.robert.demo@example.com',
        'chloe.richard.demo@example.com',
        'hugo.durand.demo@example.com',
        'lea.moreau.demo@example.com',
        'nathan.simon.demo@example.com',
        'sarah.laurent.demo@example.com'
    ];

    user_ids INTEGER[] := ARRAY[]::INTEGER[];
    new_user_id INTEGER;
    it_department_id INTEGER;
    support_department_id INTEGER;
    dev_team_id INTEGER;
    support_team_id INTEGER;
    new_session_id INTEGER;
    late_session_id INTEGER;
    missing_clock_out_session_id INTEGER;

    user_index INTEGER;
    day_offset INTEGER;
    work_day DATE;
    session_start TIMESTAMPTZ;
    session_end TIMESTAMPTZ;

BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE email = ANY(emails)
    ) THEN
        RAISE EXCEPTION
            'Jeu de test deja present, ou email en conflit. Aucune donnee ajoutee.';
    END IF;

    -- Création des 10 utilisateurs.
    FOR user_index IN 1..10 LOOP
        INSERT INTO users (
            first_name,
            last_name,
            email,
            password_hash,
            role,
            creat_at
        )
        VALUES (
            first_names[user_index],
            last_names[user_index],
            emails[user_index],
            NULL,
            CASE
                WHEN user_index = 1 THEN 'admin'
                WHEN user_index IN (2, 3) THEN 'manager'
                ELSE 'employe'
            END,
            '2026-09-01 08:00:00+02'
        )
        RETURNING id_user INTO new_user_id;

        user_ids := array_append(user_ids, new_user_id);
    END LOOP;

    -- Création des départements.
    INSERT INTO departement (name)
    VALUES ('Informatique - DEMO')
    RETURNING id_departement INTO it_department_id;

    INSERT INTO departement (name)
    VALUES ('Services clients - DEMO')
    RETURNING id_departement INTO support_department_id;

    -- Création des équipes et attribution des managers.
    INSERT INTO team (
        name,
        description,
        id_user,
        id_departement
    )
    VALUES (
        'Developpement - DEMO',
        'Equipe fictive de developpement logiciel',
        user_ids[2],
        it_department_id
    )
    RETURNING id_team INTO dev_team_id;

    INSERT INTO team (
        name,
        description,
        id_user,
        id_departement
    )
    VALUES (
        'Support - DEMO',
        'Equipe fictive de support technique',
        user_ids[3],
        support_department_id
    )
    RETURNING id_team INTO support_team_id;

    -- Les managers sont aussi membres de leur équipe.
    -- L'administrateur reste hors équipe.
    FOR user_index IN 2..10 LOOP
        INSERT INTO team_allocation (
            start_at,
            end_at,
            id_user,
            id_team
        )
        VALUES (
            '2026-09-01',
            NULL,
            user_ids[user_index],
            CASE
                WHEN user_index IN (2, 4, 5, 6) THEN dev_team_id
                ELSE support_team_id
            END
        );
    END LOOP;

    -- Création des contrats.
    FOR user_index IN 1..10 LOOP
        INSERT INTO contract (
            contract_type,
            start_date,
            end_date,
            id_user
        )
        VALUES (
            CASE
                WHEN user_index = 6 THEN 'Alternance'
                WHEN user_index = 10 THEN 'CDD'
                ELSE 'CDI'
            END,
            '2026-09-01',
            CASE
                WHEN user_index = 6 THEN DATE '2028-08-31'
                WHEN user_index = 10 THEN DATE '2027-02-28'
                ELSE NULL
            END,
            user_ids[user_index]
        );
    END LOOP;

    -- 5 jours × 10 personnes × 2 sessions = 100 sessions.
    -- Journée standard : 09h–12h puis 13h–17h = 7 heures.
    FOR user_index IN 1..10 LOOP
        FOR day_offset IN 0..4 LOOP
            work_day := DATE '2026-09-28' + day_offset;

            session_start :=
                (work_day + TIME '09:00') AT TIME ZONE 'Europe/Paris';

            session_end :=
                (work_day + TIME '12:00') AT TIME ZONE 'Europe/Paris';

            -- Emma : arrivée enregistrée à 09h15 le mercredi.
            IF user_index = 4 AND day_offset = 2 THEN
                session_start := session_start + INTERVAL '15 minutes';
            END IF;

            INSERT INTO work_session (
                start_at,
                end_at,
                creat_at,
                id_user
            )
            VALUES (
                session_start,
                session_end,
                session_start,
                user_ids[user_index]
            )
            RETURNING id_work_session INTO new_session_id;

            IF user_index = 4 AND day_offset = 2 THEN
                late_session_id := new_session_id;
            END IF;

            session_start :=
                (work_day + TIME '13:00') AT TIME ZONE 'Europe/Paris';

            session_end :=
                (work_day + TIME '17:00') AT TIME ZONE 'Europe/Paris';

            -- Lucas : 30 minutes de plus chaque après-midi.
            -- Total : 37h30 sur la semaine.
            IF user_index = 5 THEN
                session_end := session_end + INTERVAL '30 minutes';
            END IF;

            -- Sarah : oubli de sortie le vendredi, session ouverte.
            IF user_index = 10 AND day_offset = 4 THEN
                session_end := NULL;
            END IF;

            INSERT INTO work_session (
                start_at,
                end_at,
                creat_at,
                id_user
            )
            VALUES (
                session_start,
                session_end,
                session_start,
                user_ids[user_index]
            )
            RETURNING id_work_session INTO new_session_id;

            IF user_index = 10 AND day_offset = 4 THEN
                missing_clock_out_session_id := new_session_id;
            END IF;
        END LOOP;
    END LOOP;

    -- Demandes de correction des pointages.
    INSERT INTO timekeeping_correction (
        start_asked,
        end_asked,
        motif,
        status,
        process_by,
        id_work_session
    )
    VALUES
        (
            '2026-09-30 09:00:00+02',
            '2026-09-30 12:00:00+02',
            'Demande de modification de mon arrivee de 09h15 a 09h00.',
            'refusee',
            user_ids[2],
            late_session_id
        ),
        (
            '2026-10-02 13:00:00+02',
            '2026-10-02 17:00:00+02',
            'Oubli de pointage de sortie vendredi, depart a 17h00.',
            'en_attente',
            NULL,
            missing_clock_out_session_id
        );
END;
$$;

COMMIT;

-- Vérification des utilisateurs du jeu fictif.
SELECT first_name, last_name, email, role
FROM users
WHERE email LIKE '%.demo@example.com'
ORDER BY id_user;

-- Heures terminées sur la semaine :
-- la session ouverte de Sarah est exclue du total.
-- Dépasser 35h ne suffit pas à déterminer les heures supplémentaires
-- sans connaître les conditions du contrat.
SELECT
    u.first_name,
    u.last_name,
    ROUND(
        SUM(EXTRACT(EPOCH FROM (s.end_at - s.start_at))) / 3600,
        2
    ) AS completed_hours,
    COUNT(*) FILTER (
        WHERE s.end_at IS NULL
    ) AS open_sessions
FROM users u
JOIN work_session s ON s.id_user = u.id_user
WHERE u.email LIKE '%.demo@example.com'
  AND s.cancel_at IS NULL
  AND s.start_at >= TIMESTAMPTZ '2026-09-28 00:00:00+02'
  AND s.start_at < TIMESTAMPTZ '2026-10-05 00:00:00+02'
GROUP BY u.id_user, u.first_name, u.last_name
ORDER BY u.id_user;
