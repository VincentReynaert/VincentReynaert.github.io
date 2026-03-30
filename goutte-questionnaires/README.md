# Bundle questionnaires goutte

Ce dossier propose une base prête à déployer sur GitHub Pages pour regrouper les questionnaires de l'expérimentation sur une interface homogène.

## Ce que contient le bundle

- `index.html` : hub d'entrée
- `phase1.html`, `phase2.html`, `phase3.html` : pages d'enchaînement avec progression
- `questionnaire.html?form=...` : moteur générique pour les questionnaires statiques
- `configs/` : contenu des questionnaires personnalisés
- `shared/api.js` : envoi optionnel vers un backend
- `google-apps-script.gs` : backend minimal pour écrire dans Google Sheets

## Liens individuels après déploiement

Remplacez `YOUR_BASE_URL` par l'URL GitHub Pages du dépôt.

- `YOUR_BASE_URL/questionnaire.html?form=consent`
- `YOUR_BASE_URL/questionnaire.html?form=hexad`
- `YOUR_BASE_URL/questionnaire.html?form=autoefficacy`
- `YOUR_BASE_URL/questionnaire.html?form=chargeco_cours`
- `YOUR_BASE_URL/questionnaire.html?form=chargeco_vr`
- `YOUR_BASE_URL/questionnaire.html?form=ux_cours`
- `YOUR_BASE_URL/questionnaire.html?form=ux_vr`
- `YOUR_BASE_URL/questionnaire.html?form=panas`
- `https://vincentreynaert.github.io/qcm-goutte/?phase=pre`
- `https://vincentreynaert.github.io/qcm-goutte/?phase=post`
- `https://vincentreynaert.github.io/qcm-goutte/?phase=retention`
- `https://vincentreynaert.github.io/nasa-tlx/?task=Cours`

## Liens de phase après déploiement

- Phase 1 : `YOUR_BASE_URL/phase1.html?pid=P001`
- Phase 2 VR : `YOUR_BASE_URL/phase2.html?pid=P001&condition=vr`
- Phase 2 cours : `YOUR_BASE_URL/phase2.html?pid=P001&condition=cours`
- Phase 3 : `YOUR_BASE_URL/phase3.html?pid=P001`

## Envoi individuel + global

Par défaut, les données sont conservées uniquement dans `localStorage`.

Pour activer l'envoi automatique :

1. Créez une Google Sheet.
2. Collez `google-apps-script.gs` dans Apps Script.
3. Remplacez `PASTE_SPREADSHEET_ID_HERE`.
4. Déployez en Web App accessible à toute personne disposant du lien.
5. Dans `shared/api.js`, remplacez `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE` puis mettez `enabled: true`.

À chaque soumission, le système envoie :

- un payload individuel pour le questionnaire courant
- un payload global qui regroupe tout ce qui a déjà été complété pour ce participant

## Analyses déjà faites

Les scores calculés automatiquement sont déjà intégrés pour :

- Hexad
- Auto-efficacité
- Charge cognitive (ICL, GCL, ECL, total)
- PANAS (PA, NA)
- UX (motivation, enjoyment, intention, total)

## Ce qu'il faut modifier dans vos questionnaires existants

### QCM

Le QCM devrait :

- lire `pid`, `condition`, `phase`, `returnUrl` depuis l'URL
- renvoyer un payload JSON au même endpoint Apps Script
- enregistrer son résultat dans `localStorage.goutte_xp.questionnaires.qcm_<phase>`
- rediriger vers `returnUrl` après validation si ce paramètre existe

### NASA-TLX

Le NASA devrait :

- lire `pid`, `condition`, `task`, `phase`, `returnUrl`
- envoyer un payload individuel et idéalement le score RAW + pondéré
- enregistrer son résultat dans `localStorage.goutte_xp.questionnaires.nasa`
- rediriger vers `returnUrl` après validation

## Suggestion de structure commune pour tous les payloads

```json
{
  "schemaVersion": 1,
  "questionnaireKey": "ux_vr",
  "submittedAt": "2026-03-30T12:00:00.000Z",
  "participant": {
    "pid": "P001",
    "condition": "vr",
    "phase": "phase2"
  },
  "answers": {},
  "computed": {}
}
```
