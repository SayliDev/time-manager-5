# Journal des décisions

## 2026-10-09: monorepo applicatif

Le backend et le frontend vivent sous `apps/`, tandis que les données,
l'infrastructure et la documentation restent à la racine. Cette séparation
permet d'exécuter chaque application seule et de les assembler avec Compose.

## 2026-10-09: compatibilité de migration

`apps/api/main.py` est conservé temporairement pour l'ancienne API. Le nouvel
entrypoint est `apps/api/app/main.py`, utilisé par les Dockerfiles.