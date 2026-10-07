-- Time Manager : jeu fictif compatible avec le schema fourni.
-- 10 utilisateurs, 2 departements, 2 equipes, 9 affectations,
-- 10 contrats, 100 sessions et 2 demandes de correction.
-- Semaine du 28 septembre au 2 octobre 2026, fuseau Europe/Paris.
-- A executer une seule fois. Une seconde execution est refusee sans modification.
-- Aucun mot de passe : ces donnees ne permettent pas de se connecter a l'application.
-- Les horaires de contrat ne sont pas stockes : le schema ne dispose pas de ce champ.

BEGIN;
SET LOCAL TIME ZONE 'Europe/Paris';

DO $$
DECLARE
    prenoms TEXT[] := ARRAY['Alexandre','Alice','Karim','Emma','Lucas','Chloe','Hugo','Lea','Nathan','Sarah'];
    noms TEXT[] := ARRAY['Martin','Bernard','Dubois','Petit','Robert','Richard','Durand','Moreau','Simon','Laurent'];
    emails TEXT[] := ARRAY[
        'alexandre.martin.demo@example.com', 'alice.bernard.demo@example.com',
        'karim.dubois.demo@example.com', 'emma.petit.demo@example.com',
        'lucas.robert.demo@example.com', 'chloe.richard.demo@example.com',
        'hugo.durand.demo@example.com', 'lea.moreau.demo@example.com',
        'nathan.simon.demo@example.com', 'sarah.laurent.demo@example.com'
    ];
    utilisateurs_ids INTEGER[] := ARRAY[]::INTEGER[];
    utilisateur_id INTEGER;
    departement_info INTEGER;
    departement_support INTEGER;
    equipe_dev INTEGER;
    equipe_support INTEGER;
    session_id INTEGER;
    correction_retard INTEGER;
    correction_oubli INTEGER;
    i INTEGER;
    j INTEGER;
    jour DATE;
    heure_debut TIMESTAMPTZ;
    heure_fin TIMESTAMPTZ;
BEGIN
    IF EXISTS (SELECT 1 FROM utilisateur WHERE email = ANY(emails)) THEN
        RAISE EXCEPTION 'Jeu de test deja present, ou email en conflit. Aucune donnee ajoutee.';
    END IF;

    FOR i IN 1..10 LOOP
        INSERT INTO utilisateur (prenom, nom, email, password_hash, role, cree_at)
        VALUES (
            prenoms[i], noms[i], emails[i], NULL,
            CASE WHEN i = 1 THEN 'admin' WHEN i IN (2,3) THEN 'manager' ELSE 'employe' END,
            '2026-09-01 08:00:00+02'
        ) RETURNING id_utilisateur INTO utilisateur_id;
        utilisateurs_ids := array_append(utilisateurs_ids, utilisateur_id);
    END LOOP;

    INSERT INTO depatement (nom) VALUES ('Informatique - DEMO')
        RETURNING id_depatement INTO departement_info;
    INSERT INTO depatement (nom) VALUES ('Services clients - DEMO')
        RETURNING id_depatement INTO departement_support;

    INSERT INTO equipe (nom, description, id_utilisateur, id_depatement)
    VALUES ('Developpement - DEMO', 'Equipe fictive de developpement logiciel', utilisateurs_ids[2], departement_info)
        RETURNING id_equipe INTO equipe_dev;
    INSERT INTO equipe (nom, description, id_utilisateur, id_depatement)
    VALUES ('Support - DEMO', 'Equipe fictive de support technique', utilisateurs_ids[3], departement_support)
        RETURNING id_equipe INTO equipe_support;

    -- Les managers sont aussi membres de leur equipe ; l'administrateur reste hors equipe.
    FOR i IN 2..10 LOOP
        INSERT INTO affectation_equipe (debut_at, fin_at, id_utilisateur, id_equipe)
        VALUES ('2026-09-01', NULL, utilisateurs_ids[i],
            CASE WHEN i IN (2,4,5,6) THEN equipe_dev ELSE equipe_support END);
    END LOOP;

    FOR i IN 1..10 LOOP
        INSERT INTO contrat (type_contrat, date_debut, date_fin, id_utilisateur)
        VALUES (
            CASE WHEN i = 6 THEN 'Alternance' WHEN i = 10 THEN 'CDD' ELSE 'CDI' END,
            '2026-09-01',
            CASE WHEN i = 6 THEN DATE '2028-08-31' WHEN i = 10 THEN DATE '2027-02-28' ELSE NULL END,
            utilisateurs_ids[i]
        );
    END LOOP;

    -- 5 jours x 10 personnes x 2 sessions = 100 sessions.
    -- Jour standard : 09h-12h puis 13h-17h = 7 heures.
    FOR i IN 1..10 LOOP
        FOR j IN 0..4 LOOP
            jour := DATE '2026-09-28' + j;
            heure_debut := (jour + TIME '09:00') AT TIME ZONE 'Europe/Paris';
            heure_fin := (jour + TIME '12:00') AT TIME ZONE 'Europe/Paris';

            -- Emma : arrivee enregistree a 09h15 le mercredi.
            IF i = 4 AND j = 2 THEN
                heure_debut := heure_debut + INTERVAL '15 minutes';
            END IF;

            INSERT INTO session_travail (debut_at, fin_at, cree_at, id_utilisateur)
            VALUES (heure_debut, heure_fin, heure_debut, utilisateurs_ids[i])
                RETURNING id_session_travail INTO session_id;
            IF i = 4 AND j = 2 THEN correction_retard := session_id; END IF;

            heure_debut := (jour + TIME '13:00') AT TIME ZONE 'Europe/Paris';
            heure_fin := (jour + TIME '17:00') AT TIME ZONE 'Europe/Paris';

            -- Lucas : 30 minutes de plus chaque apres-midi, soit 37h30 sur la semaine.
            IF i = 5 THEN heure_fin := heure_fin + INTERVAL '30 minutes'; END IF;
            -- Sarah : oubli de sortie le vendredi (session ouverte).
            IF i = 10 AND j = 4 THEN heure_fin := NULL; END IF;

            INSERT INTO session_travail (debut_at, fin_at, cree_at, id_utilisateur)
            VALUES (heure_debut, heure_fin, heure_debut, utilisateurs_ids[i])
                RETURNING id_session_travail INTO session_id;
            IF i = 10 AND j = 4 THEN correction_oubli := session_id; END IF;
        END LOOP;
    END LOOP;

    INSERT INTO correction_pointage
        (debut_propose, fin_propose, motif, statut, traite_par, id_session_travail)
    VALUES
        ('2026-09-30 09:00:00+02', '2026-09-30 12:00:00+02',
         'Demande de modification de mon arrivee de 09h15 a 09h00.',
         'refusee', utilisateurs_ids[2], correction_retard),
        ('2026-10-02 13:00:00+02', '2026-10-02 17:00:00+02',
         'Oubli de pointage de sortie vendredi, depart a 17h00.',
         'en_attente', NULL, correction_oubli);
END;
$$;

COMMIT;

-- Verification : affiche uniquement les 10 utilisateurs de ce jeu fictif.
SELECT prenom, nom, email, role
FROM utilisateur
WHERE email LIKE '%.demo@example.com'
ORDER BY id_utilisateur;

-- Heures terminees sur la semaine : exclut la session ouverte de Sarah.
-- Une duree superieure a 35h ne suffit pas a determiner des heures supplementaires
-- sans connaitre les conditions du contrat.
SELECT u.prenom, u.nom,
       ROUND(SUM(EXTRACT(EPOCH FROM (s.fin_at - s.debut_at))) / 3600, 2) AS heures_terminees,
       COUNT(*) FILTER (WHERE s.fin_at IS NULL) AS sessions_ouvertes
FROM utilisateur u
JOIN session_travail s ON s.id_utilisateur = u.id_utilisateur
WHERE u.email LIKE '%.demo@example.com'
  AND s.annulee_at IS NULL
  AND s.debut_at >= TIMESTAMPTZ '2026-09-28 00:00:00+02'
  AND s.debut_at < TIMESTAMPTZ '2026-10-05 00:00:00+02'
GROUP BY u.id_utilisateur, u.prenom, u.nom
ORDER BY u.id_utilisateur;
