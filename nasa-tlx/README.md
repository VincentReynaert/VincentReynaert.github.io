# NASA‑TLX (complet) — GitHub Pages

Ce dossier contient un petit site **autonome** (HTML/CSS/JS) qui implémente le **NASA‑TLX complet** :

- 6 notes **0–100** (sliders)
- 15 **comparaisons par paires** (pondérations 0–5)
- Calcul automatique :
  - **Score pondéré** = Σ(note × poids) ÷ 15
  - **Score RAW** = moyenne des 6 notes
- Export **JSON** et **CSV** (téléchargement côté navigateur)
- Envoie des données vers OneDrive (obligatoire ici mais désactivable dans le code)

---

## 1) Mettre en ligne sur GitHub Pages (le plus simple)

### A. Créer un dépôt GitHub
1. Sur GitHub, créez un dépôt (ex : `nasa-tlx`).
2. Uploadez **ces 3 fichiers** à la racine du dépôt :
   - `index.html`
   - `styles.css`
   - `app.js`

### B. Activer GitHub Pages
1. Dans votre dépôt : **Settings** → **Pages**
2. **Source** : *Deploy from a branch*
3. **Branch** : `main` (ou `master`) / dossier : `/ (root)`
4. Sauvegardez

Votre questionnaire sera accessible à une URL du type :
`https://VOTRE_USER.github.io/nasa-tlx/`

---

## 2) Lancer avec un identifiant de tâche (option pratique)

Vous pouvez pré-remplir le champ “Identifiant de la tâche” via l’URL :

- `...?task=VR_ConditionA`
- `...?task=JeuVideo_1`
- `...?task=Tutorial`

Vous pouvez aussi pré-remplir un code participant (si besoin) :
- `...?pid=P042`

Exemple :
`https://VOTRE_USER.github.io/nasa-tlx/?task=VR_A&pid=P042`

---

## 3) Récupérer les données

À la fin du questionnaire, le participant (ou l’expérimentateur) peut :

- **Envoyer vers OneDrive** → pour un stockage centralisé (obligatoire ici mais désactivable dans le code)
- **Télécharger (JSON)** → complet, détaillé, facile à archiver
- **Télécharger (CSV)** → pratique pour Excel/SPSS/R/Python
- **Copier JSON** → pour coller dans un fichier / un formulaire / un chat

---

## 4) Notes sur “Performance”

La dimension **Performance** est présentée avec :
- 0 = **Très bonne** performance
- 100 = **Échec**

Cela permet de conserver une logique “plus grand = plus de charge” dans le score total.

---

## 5) Personnalisation rapide

Dans `app.js`, vous pouvez modifier :

- `SETTINGS.buildTag`
- `SETTINGS.saveToLocalStorage` (par défaut : `false`)

Le texte FR des dimensions se trouve dans la constante `DIMENSIONS`.

---

## 6) Intégrer dans un site existant

Deux solutions simples :

### Option A — Mettre dans un sous-dossier
Placez ces fichiers dans un dossier de votre site (ex : `/nasa-tlx/`) et ouvrez `index.html`.

### Option B — Iframe
Sur une page de votre site, ajoutez :

```html
<iframe
  src="https://VOTRE_USER.github.io/nasa-tlx/?task=VR_ConditionA"
  style="width: 100%; height: 920px; border: 0; border-radius: 12px;"
  title="NASA-TLX">
</iframe>
```

---

