# Conventions de nommage des fichiers

Ces conventions s'appliquent aux nouveaux fichiers. Lors d'un renommage,
mettre à jour les imports, les tests et les chemins de configuration associés.

## Règles communes

- Choisir un nom qui décrit le domaine et la responsabilité du fichier.
- Utiliser des noms en anglais pour le code, sans espaces ni accents.
- Éviter les noms vagues comme `misc`, `new`, `temp` et les suffixes `v2` ou `final`.
- Conserver la casse exacte dans les imports : les conteneurs Linux y sont sensibles.
- Respecter les noms imposés par les outils : `package.json`, `tsconfig.json`,
  `Dockerfile`, `README.md`, `.env.example`, etc.

## Backend — Python / FastAPI

Les fichiers et dossiers Python utilisent le `snake_case`.

| Responsabilité | Convention | Exemple |
| --- | --- | --- |
| Routeur | `<domain>_router.py` | `timekeeping_router.py` |
| Service métier | `<domain>_service.py` | `timekeeping_service.py` |
| Repository SQL | `<entity>_repository.py` | `users_repository.py` |
| Schéma de validation | `<domain>_schema.py` | `users_schema.py` |
| Module métier ou utilitaire | `<responsibility>.py` | `security.py`, `password_generator.py` |
| Test | `test_<module_or_behavior>.py` | `test_timekeeping_service.py` |
| Fixtures pytest partagées | `conftest.py` | `tests/conftest.py` |

Les points d'entrée comme `main.py` et les fichiers de package `__init__.py`
conservent leur nom standard.

Le dépôt contient aussi des noms historiques, par exemple `time.py`, `kpi.py`,
`teams.py`, `users_routers.py`, `work_session.py` et `time_api.py`.
Ils restent utilisables ; ne pas créer un second fichier pour le même rôle
uniquement pour respecter un suffixe. Leur harmonisation nécessite de mettre
à jour tous leurs consommateurs.

## Frontend — React / TypeScript

Les dossiers de fonctionnalités et de responsabilités sont en minuscules
(`features/time/hooks`, `features/users/components`). Pour un dossier de plusieurs
mots, utiliser le `kebab-case`.

| Responsabilité | Convention | Exemple |
| --- | --- | --- |
| Composant React | `PascalCase.tsx` | `EntriesTable.tsx` |
| Page | `<Name>Page.tsx` | `TimePage.tsx` |
| Hook React | `use<Name>.ts` | `useTimekeeping.ts` |
| Client API centralisé | `shared/api/client.ts` | `shared/api/client.ts` |
| Utilitaire ou constantes | `camelCase.ts` | `format.ts`, `weeklyRows.ts` |
| Types d'une fonctionnalité | `types.ts` | `features/time/types.ts` |
| Feuille de style | `kebab-case.css` | `index.css` |

Le fichier d'un composant ou d'un hook porte le même nom que son export
principal. Les points d'entrée existants `main.tsx` et `App.tsx` conservent
leur nom. Tous les appels HTTP, chemins de routes, paramètres et adaptateurs
de réponses sont regroupés dans `shared/api/client.ts`. Les hooks des
fonctionnalités importent ses fonctions ; ne pas créer de client API parallèle
dans une fonctionnalité. `mockQueries.ts` est actuellement un
adaptateur de compatibilité vers les API réelles ; son nom historique
n'autorise pas l'ajout de données fictives aux écrans de production.

## Base de données — SQL

Les scripts utilisent un préfixe numérique, suivi d'une description en
`kebab-case`, puis de l'extension `.sql`.

| Dossier | Convention | Exemple |
| --- | --- | --- |
| `database/init/` | `<NN>-<description>.sql` | `01-schema.sql`, `10-time-api.sql` |
| `database/seeds/` | `<NN>-<description>.sql` | `02-donnees-test.sql` |
| `database/migrations/` | `<NNN>-<description>.sql` | `001-time-api.sql` |

Conserver la même largeur de préfixe dans chaque dossier pour garantir l'ordre
lexicographique. Choisir le prochain numéro disponible ; les numéros peuvent
comporter des trous. Les descriptions françaises existantes des seeds sont
conservées, sans accents dans les noms de fichiers.

Ne pas renuméroter une migration déjà appliquée. Pour une évolution suivante,
ajouter un nouveau script. Si un script est référencé dans Docker Compose,
mettre également à jour son chemin de montage et son ordre d'exécution.

## Documentation et configuration

- Documentation : `kebab-case.md`, par exemple `time-api.md` ou `git-conventions.md`.
- Docker : `Dockerfile.dev`, `Dockerfile.prod`, `docker-compose.yml` et
  `docker-compose.prod.yml`, conformément aux fichiers existants.
- Configuration : conserver les extensions et noms attendus par chaque outil,
  par exemple `vite.config.ts`, `pytest.ini` et `requirements-dev.txt`.

Les conventions de nommage des branches et commits sont décrites séparément
dans [git-conventions.md](git-conventions.md).
