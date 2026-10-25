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

Un employ? acc?de ? ses donn?es, un manager aux collaborateurs actuellement
rattach?s aux ?quipes dont `team.id_user` le d?signe responsable (et ? ses
propres donn?es), un administrateur ? tous les comptes actifs. Une ?quipe
explicitement demand?e hors p?rim?tre renvoie 403.

Les instants sont en UTC avec suffixe Z. Les journ?es et semaines suivent le
calendrier Europe/Paris, comme les calculs existants. Les bornes `from` et
`to` sont inclusives, au format YYYY-MM-DD, limit?es ? 367 jours. La p?riode
par d?faut des historiques va du premier jour du mois ? aujourd?hui.
Les sessions annul?es sont exclues, les sessions ouvertes ne contribuent
pas aux heures. Les heures sont d?cimales et arrondies ? deux chiffres.
Les historiques incluent les jours sans travail avec z?ro heure.

## R?gles configurables

Ces choix sont des valeurs initiales en attente de validation m?tier :

- Objectif : `contract.weekly_hours`, 35 heures par d?faut.
- Arriv?e pr?vue : `contract.expected_start`, 09:00 heure de Paris.
- Tol?rance : `contract.late_tolerance_minutes`, 5 minutes. Une arriv?e ?
  09:05 n?est pas en retard ; seule la premi?re arriv?e du jour compte.
- Suppl?ment : `contract.overtime_threshold_hours`, 0 par d?faut. Le total
  hebdomadaire doit d?passer objectif + suppl?ment. Le retard est prioritaire
  sur le statut overtime d?une session ; le r?sum? cumule les heures sup.
- Une session ouverte d?une journ?e pass?e devient missing ? minuit ? Paris.
- `leave_absence` contient les p?riodes de cong? inclusives. Les weekends
  sont ?galement off, sans calendrier de jours f?ri?s.
- L?objectif du r?sum? est un objectif entier pour chaque semaine intersect?e,
  sans proratisation des semaines partielles.
- Les tendances portent sur six p?riodes, compar?es sur le m?me nombre de
  jours ?coul?s, plafonn? ? la longueur de chaque p?riode. Une base pr?c?dente
  nulle donne une variation de 0 (convention, pour ?viter une division par z?ro).
- La pr?sence mesure les journ?es avec arriv?e / journ?es ouvr?es attendues,
  cong?s exclus. Les heures moyennes excluent les sessions ouvertes.

## Migration

Pour une base existante, ex?cuter `database/migrations/001-time-api.sql` une
fois avant de d?marrer le nouveau code. Elle est r?ex?cutable et ne supprime
pas les donn?es. `database/init/10-time-api.sql` applique le m?me sch?ma aux
nouvelles installations Docker. Le champ existant `work_session.work_mode`
est conserv? et expos? sous le nom `mode` dans les r?ponses.

La migration a ?t? appliqu?e ? la base Docker locale pendant ce refactoring.
Les contrats sont aliment?s avec les valeurs par d?faut ; les cong?s sont
vides tant qu?ils ne sont pas renseign?s.

Les lectures historiques utilisent les rattachements actuels ? la date de fin
demand?e, et non une reconstruction des droits pour chaque jour. Aucun
endpoint de gestion des cong?s n?est ajout? dans ce p?rim?tre. Les formulaires
de gestion des ?quipes et utilisateurs pr?existants ont seulement leurs
options branch?es sur les donn?es r?elles ; leurs mutations restent ? traiter
s?par?ment.
