# Suite questionnaires – expérimentation goutte

## Changements de cette version
- **Phases 1 et 2 séquentielles** : on ne peut continuer que vers le questionnaire suivant.
- **Phase 1** : le PID est déterminé depuis le formulaire de consentement à partir du nom et du prénom ; si le participant n’existe pas, un nouveau PID libre est proposé puis ajouté à la base.
- **Phase 2** : l’accueil de phase demande d’abord le nom et le prénom avant d’ouvrir le premier questionnaire.
- **Bug NASA-TLX corrigé** : les comparaisons binaires s’arrêtent bien après 15 choix.

## Important sur l’ajout à la base
Pour qu’un **nouveau participant soit ajouté à la base partagée**, il faut activer le backend Google Apps Script.
Sans backend, l’ajout fonctionne seulement **localement dans le navigateur utilisé pour la passation**.

## Ce qui est inclus
- un lien distinct par questionnaire (`consent.html`, `hexad.html`, `autoefficacy-pre.html`, etc.) ;
- 3 pages de phase (`phase1.html`, `phase2.html`, `phase3.html`) avec progression et nombre de questionnaires restants ;
- un style unique pour tous les questionnaires, y compris NASA-TLX et QCM ;
- un stockage local commun (`localStorage`) ;
- un envoi individuel + un envoi global via `shared/api.js` ;
- un système de PID basé sur `data/roster.json` et/ou le backend Apps Script.

## Format des PID
`NOMpreXX`
- `NOM` = 3 premières lettres du nom en majuscules
- `pre` = 3 premières lettres du prénom en minuscules
- `XX` = numéro libre automatiquement proposé

Exemple : `DUPali07`

## Base des étudiants
Remplir `data/roster.json` à partir de `data/roster.example.json`.

Exemple minimal :
```json
[
  { "lastName": "DUPONT", "firstName": "Alice", "pid": "DUPali07", "condition": "vr" },
  { "lastName": "MARTIN", "firstName": "Léo", "pid": "MARleo03", "condition": "cours" }
]
```

## Envoi des données et gestion de la base
### Option recommandée : Google Apps Script
- coller le contenu de `google-apps-script.gs` dans Apps Script ;
- remplacer `PASTE_SPREADSHEET_ID_HERE` par l’ID du Google Sheet ;
- publier le script en tant que Web App ;
- reporter l’URL du Web App dans `shared/api.js` et passer `enabled: true`.

Le script gère maintenant :
- l’enregistrement des questionnaires ;
- l’enregistrement du bundle global ;
- la recherche d’un participant dans l’onglet `roster` ;
- la création d’un nouveau participant dans cet onglet.

## Liens principaux
- `index.html`
- `phase1.html`
- `phase2.html?condition=cours`
- `phase2.html?condition=vr`
- `phase3.html`
