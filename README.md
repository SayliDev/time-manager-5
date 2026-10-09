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


Le nouvel entrypoint backend est `apps/api/app/main.py`. L'ancien `apps/api/main.py` est conservé temporairement pour faciliter la migration.

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
