# Suite questionnaires – expérimentation goutte

## Ce qui est inclus
- un lien distinct par questionnaire (`consent.html`, `hexad.html`, `autoefficacy-pre.html`, etc.) ;
- 3 pages de phase (`phase1.html`, `phase2.html`, `phase3.html`) avec progression et nombre de questionnaires restants ;
- un style unique pour tous les questionnaires, y compris NASA-TLX et QCM ;
- un stockage local commun (`localStorage`) ;
- un envoi individuel + un envoi global via `shared/api.js` ;
- un système de PID basé sur `data/roster.json`.

## Format des PID
Le format attendu est : `NOMpreXX`
- `NOM` = 3 premières lettres du nom en majuscules
- `pre` = 3 premières lettres du prénom en minuscules
- `XX` = numéro arbitraire choisi par vous

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

### Comportement mis en place
- **Consentement / phase 1** : le participant saisit `Nom` + `Prénom`, le site recherche automatiquement le PID dans `roster.json`.
- **Phases 2 et 3** : si le PID n'est pas déjà présent dans l'URL ou en mémoire locale, le site demande `Nom` + `Prénom`, recherche dans la base et :
  - s'il n'y a qu'un seul PID, il l'utilise automatiquement ;
  - s'il y en a plusieurs avec le même préfixe, le participant choisit celui qui correspond à son numéro `XX`.

## HEXAD
Le code interne `A1`, `R2`, etc. n'est **pas** affiché au participant.

Deux modes d'ordre sont disponibles :
- `hexad.html?order=code` : ordre `A1, A2, A3, ...`
- `hexad.html?order=random` : ordre aléatoire

## Déploiement GitHub Pages
1. mettre tout le dossier dans un dépôt GitHub ;
2. activer GitHub Pages sur la branche voulue ;
3. utiliser `index.html` comme hub principal.

## Envoi des données
### Option simple : Google Apps Script
- coller le contenu de `google-apps-script.gs` dans Apps Script ;
- remplacer `PASTE_SPREADSHEET_ID_HERE` par l'ID du Google Sheet ;
- publier le script en tant que Web App ;
- reporter l'URL du Web App dans `shared/api.js` et passer `enabled: true`.

## Fichiers à connaître
- `shared/api.js` : endpoint d'envoi
- `shared/form-engine.js` : moteur des questionnaires génériques
- `shared/phase-app.js` : pages de phase
- `apps/nasa.js` : NASA-TLX unifié
- `apps/qcm.js` : QCM unifié
- `data/roster.json` : base des étudiants

## Liens principaux
- `index.html`
- `phase1.html`
- `phase2.html?condition=cours`
- `phase2.html?condition=vr`
- `phase3.html`
