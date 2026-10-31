# API de pointage et dashboard

Pour les noms des fichiers backend, frontend, SQL et documentation, suivre les
[conventions de nommage des fichiers](file-naming-conventions.md).

## Branchement du frontend

Une équipe conserve son responsable principal dans `team.id_user`. La table
`team_manager` permet de rattacher des managers supplémentaires sans retirer
les droits du responsable principal. Ces rattachements sont pris en compte
dans toutes les lectures utilisant `load_scope`. Un employé ne bénéficie pas
de ces droits, même si une ligne de rattachement lui est associée.

Pour une base existante, appliquer également
`database/migrations/002-team-managers.sql`. Les installations neuves utilisent
`database/init/11-team-managers.sql`. Les rattachements sont des données de la
base : les migrations de schéma n'accordent aucun accès à un compte particulier.

Le dashboard affiche « Aucune équipe à gérer » lorsqu'un manager n'a aucun
rattachement, avec un bouton d'actualisation et un lien vers ses pointages.

Le tableau de bord appelle directement `/api/dashboard/kpis`, `/hours`,
`/presence` et `/activity`. Le filtre `team_id` est envoyé aux quatre routes,
avec `period=week|month`. Les équipes viennent de `/api/teams`.

La page Pointages appelle `/api/users/{id}/work-sessions`, `/hours/daily`,
`/hours/weekly` et `/time-summary` en parallèle, avec les mêmes bornes `from`
et `to`. Le lien depuis la fiche employé transmet `user_id` dans l'URL du front.
Les boutons d'arrivée et de départ appellent `/api/work-sessions/clock-in` et
`/clock-out` pour l'utilisateur connecté, puis actualisent les données affichées.

Les appels passent par `shared/api/client.ts`, qui transmet le token, les
cookies de session et le signal d'annulation. Les erreurs API sont affichées
dans les pages. Les lectures sont actualisées toutes les 60 secondes ; les
horaires UTC sont affichés en heure de Paris et une durée ouverte reste vide.
Les pages n'utilisent plus les imports de données fictives. `mockQueries.ts` ne conserve que des
réexports de compatibilité vers les hooks des fonctionnalités.

`shared/api/client.ts` est également le point d'entrée unique pour les fonctions
`login`, `getMe`, `fetchProfile`, `fetchTeams`, `fetchUsers`, `fetchDashboard`,
`fetchTimekeeping`, les lectures détaillées des heures et les opérations de
pointage. Il contient les routes, la construction des filtres, les types des
réponses API et leur adaptation pour l'affichage. Les anciens modules
`authApi.ts`, `usersApi.ts`, `timekeepingApi.ts` et `features/dashboard/api.ts`
ont été supprimés ; les hooks et les composants importent directement le client
commun. L'URL de connexion Microsoft est aussi construite dans ce fichier.

Les mutations des formulaires de gestion des équipes et utilisateurs restent
indépendantes de ce branchement pointages/dashboard.

Les nouvelles routes `/api/users/{id}/work-sessions`, `/hours/daily`,
`/hours/weekly`, `/time-summary`, `/api/work-sessions/clock-in`,
`/clock-out`, `/api/dashboard/{kpis,hours,presence,activity}` exigent une
session authentifiée. La route `/api/teams` fournit les équipes du périmètre.

Un employé accède à ses données, un manager aux collaborateurs actuellement
rattachés aux équipes dont `team.id_user` le désigne responsable (et à ses
propres données), un administrateur à tous les comptes actifs. Une équipe
explicitement demandée hors périmètre renvoie 403.

Les instants sont en UTC avec suffixe Z. Les journées et semaines suivent le
calendrier Europe/Paris, comme les calculs existants. Les bornes `from` et
`to` sont inclusives, au format YYYY-MM-DD, limitées à 367 jours. La période
par défaut des historiques va du premier jour du mois à aujourd'hui.
Les sessions annulées sont exclues, les sessions ouvertes ne contribuent
pas aux heures. Les heures sont décimales et arrondies à deux chiffres.
Les historiques incluent les jours sans travail avec zéro heure.

## Règles configurables

Ces choix sont des valeurs initiales en attente de validation métier :

- Objectif : `contract.weekly_hours`, 35 heures par défaut.
- Arrivée prévue : `contract.expected_start`, 09:00 heure de Paris.
- Tolérance : `contract.late_tolerance_minutes`, 5 minutes. Une arrivée à
  09:05 n'est pas en retard ; seule la première arrivée du jour compte.
- Supplément : `contract.overtime_threshold_hours`, 0 par défaut. Le total
  hebdomadaire doit dépasser objectif + supplément. Le retard est prioritaire
  sur le statut overtime d'une session ; le résumé cumule les heures sup.
- Une session ouverte d'une journée passée devient missing à minuit à Paris.
- `leave_absence` contient les périodes de congé inclusives. Les weekends
  sont également off, sans calendrier de jours fériés.
- L'objectif du résumé est un objectif entier pour chaque semaine intersectée,
  sans proratisation des semaines partielles.
- Les tendances portent sur six périodes, comparées sur le même nombre de
  jours écoulés, plafonné à la longueur de chaque période. Une base précédente
  nulle donne une variation de 0 (convention, pour éviter une division par zéro).
- La présence mesure les journées avec arrivée / journées ouvrées attendues,
  congés exclus. Les heures moyennes excluent les sessions ouvertes.

## Migration

Pour une base existante, exécuter `database/migrations/001-time-api.sql` une
fois avant de démarrer le nouveau code. Elle est réexécutable et ne supprime
pas les données. `database/init/10-time-api.sql` applique le même schéma aux
nouvelles installations Docker. Le champ existant `work_session.work_mode`
est conservé et exposé sous le nom `mode` dans les réponses.

La migration a été appliquée à la base Docker locale pendant ce refactoring.
Les contrats sont alimentés avec les valeurs par défaut ; les congés sont
vides tant qu'ils ne sont pas renseignés.

Les lectures historiques utilisent les rattachements actuels à la date de fin
demandée, et non une reconstruction des droits pour chaque jour. Aucun
endpoint de gestion des congés n'est ajouté dans ce périmètre. Les formulaires
de gestion des équipes et utilisateurs préexistants ont seulement leurs
options branchées sur les données réelles ; leurs mutations restent à traiter
séparément.
