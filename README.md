Time Manager

Application de gestion du temps de travail pour les employés et managers de Trinity Market.

## Architecture
apps/api/       FastAPI, domaine, routes, services et tests
apps/client/    React + Vite
database/       Schéma et données de développement PostgreSQL
docker-compose.yml       environnement local
docker-compose.prod.yml  assemblage de production avec nginx
nginx/          reverse proxy `/api` vers l'API
docs/           décisions, tests et diagrammes du projet


Le nouvel entrypoint backend est `apps/api/app/main.py`. L'ancien `apps/api/main.py` a été supprimé.

## Lancement local

1. Copier `.env.example` vers `.env` et remplacer les secrets.
2. Lancer `docker compose up --build`.
3. Ouvrir le frontend sur <http://localhost:5173> et la documentation API sur <http://localhost:8001/docs>.

La base PostgreSQL écoute sur le port `5434` par défaut. Les scripts de `database/init` sont exécutés à la création du volume.

## Développement sans Docker

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

```bash
cd apps/client
npm install
npm run dev
```

## Qualité

```bash
cd apps/api && ruff check . && pytest
cd apps/client && npm run lint && npm run build
```

Les contributions doivent conserver les données personnelles hors des logs et des fichiers de configuration versionnés.


# Time Manager — installation locale complète

Ce dossier est autonome. Il contient PostgreSQL, sept tables, dix personnes fictives et une petite API FastAPI pour vérifier la connexion. Il ne remplace pas votre backend existant : testez-le dans un nouveau dossier.

## 1. Préparer

1. Démarrer Docker Desktop et attendre le démarrage du moteur Linux.
2. Extraire entièrement le ZIP, puis ouvrir dans VS Code le dossier qui contient `compose.yaml`.
3. Tous les chemins sont relatifs à ce dossier. Ne déplacer aucun fichier.
4. Le `.env` est déjà fourni pour une démonstration locale ; modifier son mot de passe avant la première initialisation si souhaité.
5. Docker doit avoir accès à Internet au premier lancement pour télécharger les images et les dépendances Python. Python et PostgreSQL n'ont pas besoin d'être installés sur Windows.

## 2. Vérifier Docker

Dans le terminal de VS Code :

```powershell
docker version
```

Il faut les sections Client ET Server. Sinon démarrer/réparer Docker Desktop avant de continuer.

Vérification facultative du YAML :

```powershell
docker compose config --quiet
```

Sans sortie = configuration acceptée. N'envoyez pas la sortie de `docker compose config` sans `--quiet` : elle peut afficher le mot de passe.

## 3. Une seule commande de démarrage

```powershell
docker compose up -d --build --wait
```

Cette commande construit l'API, crée le conteneur PostgreSQL et le volume, initialise la base, puis exécute `01-schema.sql` et `02-donnees-test.sql` dans cet ordre sur un volume vide. Elle attend ensuite les contrôles de santé de la base et de l'API.

Le projet s'appelle `time-manager-install`. Son volume est distinct de `dev_postgres_data` et `time-manager-clean_postgres_data`. Les anciens volumes ne sont pas supprimés.

Les ports 5434 et 8001 sont choisis pour éviter les ports précédemment employés. S'ils sont occupés, changer seulement DATABASE_PORT et APP_PORT dans `.env`, puis adapter les adresses ci-dessous. Le port interne DB_PORT reste 5432.

## 4. Vérifier dans le navigateur

- http://localhost:8001/ : message de démarrage.
- http://localhost:8001/health : état et nombre de lignes de chaque table.
- http://localhost:8001/utilisateurs : les dix personnes fictives.
- http://localhost:8001/docs : documentation interactive des routes.

Résultat attendu de /health :

```json
{"status":"ok","tables":{"utilisateur":10,"depatement":2,"equipe":2,"affectation_equipe":9,"contrat":10,"session_travail":100,"correction_pointage":2}}
```

Ce contrôle prouve que les sept tables sont interrogeables ; comparer les comptes ci-dessus pour vérifier l'insertion complète. La route ne force pas les comptes à rester constants lorsque vous modifiez les données.

## 5. Vérifier avec SQL

```powershell
docker compose ps
docker compose exec db psql -U time_manager -d time_manager -c "\dt public.*"
docker compose exec db psql -U time_manager -d time_manager -c "SELECT id_utilisateur, prenom, nom, role FROM utilisateur;"
```

Pour parcourir toutes les tables :

```powershell
docker compose exec db psql -U time_manager -d time_manager
```

Puis dans la console SQL :

```sql
\pset pager off
SELECT * FROM utilisateur;
SELECT * FROM depatement;
SELECT * FROM equipe;
SELECT * FROM affectation_equipe;
SELECT * FROM contrat;
SELECT * FROM session_travail;
SELECT * FROM correction_pointage;
\q
```

## 6. Connexion DBeaver / pgAdmin

- Hôte : localhost
- Port : 5434
- Base : time_manager
- Utilisateur : time_manager
- Mot de passe : valeur de POSTGRES_PASSWORD dans .env

Dans l'API conteneurisée, l'hôte est `db`, le port est `5432`. Ne pas utiliser localhost:5434 entre conteneurs.

## 7. Arrêter et redémarrer

```powershell
docker compose down
docker compose up -d --build --wait
```

Les données restent dans le volume. Les scripts d'initialisation ne sont pas rejoués et le jeu de données n'est pas dupliqué.

Modifier POSTGRES_USER, POSTGRES_DB ou POSTGRES_PASSWORD dans `.env` après initialisation ne modifie pas automatiquement les comptes ou la base déjà enregistrés. Pour ces changements sur une base à conserver, utiliser des commandes SQL appropriées.

## 8. Diagnostic avant toute suppression

```powershell
docker compose logs --tail=150 db
docker compose logs --tail=100 app
docker compose exec db ls -la /docker-entrypoint-initdb.d/
```

Un dossier absent fait échouer le montage plutôt que de créer silencieusement un dossier vide. Les deux fichiers SQL doivent être visibles dans le conteneur. Si db est arrêté, `exec` ne fonctionne pas : lire les logs d'abord.

Pas de politique de redémarrage automatique dans cette démonstration : une erreur initiale de script doit rester visible. Après un échec d'initialisation, ne pas simplement relancer en supposant que les scripts seront rejoués : PostgreSQL peut déjà avoir initialisé son volume.

## 9. Remise à zéro facultative (destructive)

UNIQUEMENT pour jeter les données de CE projet et réinitialiser les scripts :

```powershell
docker compose down -v
docker compose up -d --build --wait
```

À lancer dans ce dossier. La première commande supprime le volume PostgreSQL de `time-manager-install` et toutes ses données. Elle n'est pas nécessaire pour l'installation initiale et ne doit pas devenir une commande de démarrage habituelle.

## Limites de cette démonstration

- API sans authentification, accessible sur la boucle locale uniquement. Le compte de connexion est le compte d'administration initial PostgreSQL. Pour intégrer au vrai backend, utiliser des comptes limités et votre authentification.
- Les valeurs employe/manager/admin dans utilisateur sont des données : elles n'appliquent pas encore de permissions.
- Mots de passe utilisateur NULL : aucune connexion utilisateur n'est implémentée.
- Les contrats n'ont pas encore de durée hebdomadaire ; le script ne détermine pas les heures supplémentaires légales.
- Le nom `depatement` est volontairement conservé pour correspondre à votre schéma actuel.
- Les fichiers ont été contrôlés statiquement. Le démarrage Docker n'a pas pu être exécuté dans l'environnement de préparation ; la commande --wait et la page /health permettent la vérification sur votre PC.

## Contenu exact de chaque fichier

Le contenu ci-dessous correspond aux fichiers fournis dans l'archive. Vous pouvez aussi les ouvrir directement dans VS Code.

### `compose.yaml`

```yaml
name: time-manager-install

services:
  db:
    image: postgres:18
    environment:
      POSTGRES_DB: ${POSTGRES_DB:?POSTGRES_DB absent du .env}
      POSTGRES_USER: ${POSTGRES_USER:?POSTGRES_USER absent du .env}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD absent du .env}
      TZ: Europe/Paris
    ports:
      - "127.0.0.1:${DATABASE_PORT:-5434}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql
      - type: bind
        source: ./database/init
        target: /docker-entrypoint-initdb.d
        read_only: true
        bind:
          create_host_path: false
    healthcheck:
      test:
        - CMD-SHELL
        - pg_isready -h 127.0.0.1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 30s

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      PYTHONUNBUFFERED: "1"
      DB_HOST: db
      DB_PORT: "5432"
      DB_NAME: ${POSTGRES_DB:?POSTGRES_DB absent du .env}
      DB_USER: ${POSTGRES_USER:?POSTGRES_USER absent du .env}
      DB_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD absent du .env}
    ports:
      - "127.0.0.1:${APP_PORT:-8001}:8000"
    volumes:
      - type: bind
        source: ./main.py
        target: /app/main.py
        read_only: true
        bind:
          create_host_path: false
    depends_on:
      db:
        condition: service_healthy
    command: ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4)"]
      interval: 5s
      timeout: 5s
      retries: 12
      start_period: 20s

volumes:
  postgres_data:
```

### `.env`

```text
POSTGRES_DB=time_manager
POSTGRES_USER=time_manager
POSTGRES_PASSWORD=DemoLocal_2026_ChangeMoi
DATABASE_PORT=5434
APP_PORT=8001
```

### `.env.example`

```text
POSTGRES_DB=time_manager
POSTGRES_USER=time_manager
POSTGRES_PASSWORD=DemoLocal_2026_ChangeMoi
DATABASE_PORT=5434
APP_PORT=8001
```

### `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `requirements.txt`

```text
fastapi==0.115.12
uvicorn==0.34.2
psycopg[binary]==3.2.9
```

### `main.py`

```python
"""API locale de demonstration. Sans authentification, donnees fictives uniquement."""
import os
import logging

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from fastapi import FastAPI, HTTPException

app = FastAPI(title="Time Manager - verification locale")
TABLES = (
    "utilisateur", "depatement", "equipe", "affectation_equipe",
    "contrat", "session_travail", "correction_pointage",
)


def connexion():
    return psycopg.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        connect_timeout=5,
        row_factory=dict_row,
    )


@app.get("/")
def accueil():
    return {"message": "Time Manager fonctionne", "verification": "/health", "documentation": "/docs"}


@app.get("/health")
def verification():
    try:
        with connexion() as conn:
            counts = {}
            for table in TABLES:
                query = sql.SQL("SELECT COUNT(*) AS total FROM public.{}").format(sql.Identifier(table))
                counts[table] = conn.execute(query).fetchone()["total"]
        return {"status": "ok", "tables": counts}
    except psycopg.Error:
        logging.exception("Verification PostgreSQL impossible")
        raise HTTPException(status_code=503, detail="Base inaccessible ou schema incomplet : consulter les logs.")


@app.get("/utilisateurs")
def utilisateurs():
    with connexion() as conn:
        return conn.execute(
            "SELECT id_utilisateur, prenom, nom, email, role "
            "FROM public.utilisateur ORDER BY id_utilisateur"
        ).fetchall()
```

### `.gitignore`

```text
.env
__pycache__/
*.pyc
.venv/
```

### `.dockerignore`

```text
.env
.env.example
.git
.venv
__pycache__
*.pyc
database
README.md
```

### `database/init/01-schema.sql`

```sql
-- Schema compatible PostgreSQL 18. Conserve le nom historique 'depatement'.
BEGIN;

CREATE TABLE utilisateur (
    id_utilisateur INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prenom VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    role VARCHAR(50),
    telephone VARCHAR(50),
    cree_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    desactive_at TIMESTAMPTZ
);

CREATE TABLE session_travail (
    id_session_travail INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debut_at TIMESTAMPTZ NOT NULL,
    fin_at TIMESTAMPTZ,
    annulee_at TIMESTAMPTZ,
    cree_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    CHECK (fin_at IS NULL OR fin_at >= debut_at)
);

CREATE TABLE depatement (
    id_depatement INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(50)
);

CREATE TABLE equipe (
    id_equipe INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    description TEXT,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    id_depatement INTEGER NOT NULL REFERENCES depatement(id_depatement)
);

CREATE TABLE affectation_equipe (
    id_affectation_equipe INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debut_at DATE NOT NULL,
    fin_at DATE,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    id_equipe INTEGER NOT NULL REFERENCES equipe(id_equipe),
    CHECK (fin_at IS NULL OR fin_at >= debut_at)
);

CREATE TABLE contrat (
    id_contrat INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type_contrat VARCHAR(50),
    date_debut DATE NOT NULL,
    date_fin DATE,
    id_utilisateur INTEGER NOT NULL REFERENCES utilisateur(id_utilisateur),
    CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

CREATE TABLE correction_pointage (
    id_correction_pointage INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    debut_propose TIMESTAMPTZ,
    fin_propose TIMESTAMPTZ,
    motif TEXT,
    statut VARCHAR(50),
    traite_par INTEGER REFERENCES utilisateur(id_utilisateur),
    id_session_travail INTEGER REFERENCES session_travail(id_session_travail),
    CHECK (fin_propose IS NULL OR debut_propose IS NULL OR fin_propose >= debut_propose)
);

COMMIT;
```

### `database/init/02-donnees-test.sql`

```sql
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



