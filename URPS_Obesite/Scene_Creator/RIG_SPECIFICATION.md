# Architecture de Rig Humanoïde SVG - Spécification

## Vue d'ensemble
Cette spécification définit une structure SVG générique **minimale** pour un rig humanoïde animable avec des sliders de contrôle par articulation.

## Structure hiérarchique

```
<svg viewBox="...">
  <g id="[RootName]">                    <!-- Groupe racine (ex: "Doctor", "Character") -->
    
    <!-- TÊTE -->
    <g id="Head">
      <path .../>                        <!-- Géométrie de la tête -->
      <circle id="Neck" cx="..." cy="..." r="..."/>  <!-- Pivot -->
    </g>
    
    <!-- BRAS GAUCHE -->
    <g id="LeftArm">
      <path .../>                        <!-- Partie supérieure du bras -->
      <circle id="LeftShoulder" cx="..." cy="..." r="..."/>  <!-- Pivot d'articulation -->
    </g>
    
    <g id="LeftForearm">
      <path .../>                        <!-- Avant-bras -->
      <circle id="LeftElbow" cx="..." cy="..." r="..."/>  <!-- Pivot d'articulation -->
    </g>
    
    <!-- BRAS DROIT -->
    <g id="RightArm">
      <path .../>
      <circle id="RightShoulder" cx="..." cy="..." r="..."/>
    </g>
    
    <g id="RightForearm">
      <path .../>
      <circle id="RightElbow" cx="..." cy="..." r="..."/>
    </g>
    
    <!-- JAMBE GAUCHE -->
    <g id="LeftLeg">
      <path .../>                        <!-- Cuisse -->
      <circle id="LeftHip" cx="..." cy="..." r="..."/>  <!-- Pivot d'articulation -->
    </g>
    
    <g id="LeftLowerLeg">
      <path .../>                        <!-- Tibia -->
      <circle id="LeftKnee" cx="..." cy="..." r="..."/>  <!-- Pivot d'articulation -->
    </g>
    
    <!-- JAMBE DROITE -->
    <g id="RightLeg">
      <path .../>
      <circle id="RightHip" cx="..." cy="..." r="..."/>
    </g>
    
    <g id="RightLowerLeg">
      <path .../>
      <circle id="RightKnee" cx="..." cy="..." r="..."/>
    </g>

    <!-- VISAGE (optionnel) -->
    <g id="LeftEye">
      <path .../>
    </g>

    <g id="RightEye">
      <path .../>
    </g>

    <g id="LeftEyebrow">
      <path .../>
    </g>

    <g id="RightEyebrow">
      <path .../>
    </g>
    
  </g>
  
  <!-- GROUPE DE PIVOT (optionnel - pour visualiser les points) -->
  <g id="PivotReference" display="none">
    <!-- Cercles de debug aux positions des pivots -->
  </g>
</svg>
```

## Règles de nommage

### Groupes de parties (g[id])
Les groupes doivent suivre la nomenclature exacte :

| Partie | ID du groupe | Pivot attendu |
|--------|-------------|---------------|
| Tête | `Head` | `Neck` |
| Bras gauche | `LeftArm` | `LeftShoulder` |
| Avant-bras gauche | `LeftForearm` | `LeftElbow` |
| Bras droit | `RightArm` | `RightShoulder` |
| Avant-bras droit | `RightForearm` | `RightElbow` |
| Jambe haute gauche | `LeftLeg` | `LeftHip` |
| Jambe basse gauche | `LeftLowerLeg` | `LeftKnee` |
| Jambe haute droit | `RightLeg` | `RightHip` |
| Jambe basse droit | `RightLowerLeg` | `RightKnee` |
| Oeil gauche (optionnel) | `LeftEye` | Centre du groupe (auto) |
| Oeil droit (optionnel) | `RightEye` | Centre du groupe (auto) |
| Sourcil gauche (optionnel) | `LeftEyebrow` | Aucun pivot requis |
| Sourcil droit (optionnel) | `RightEyebrow` | Aucun pivot requis |

### Points de pivot (circle[id] ou ellipse[id])
Les pivots sont des éléments `<circle>` ou `<ellipse>` **enfants directs** du groupe de partie.

Nommage obligatoire des pivots :
- `Neck` - pivot de tête
- `LeftShoulder`, `LeftElbow` - bras gauche
- `RightShoulder`, `RightElbow` - bras droit
- `LeftHip`, `LeftKnee` - jambe gauche
- `RightHip`, `RightKnee` - jambe droit

## Structure logique d'articulation

Chaque groupe contrôle **UNE SEULE articulation** :

```
LeftArm        → pivot autour de LeftShoulder
LeftForearm    → pivot autour de LeftElbow
RightArm       → pivot autour de RightShoulder
RightForearm   → pivot autour de RightElbow

LeftLeg        → pivot autour de LeftHip
LeftLowerLeg   → pivot autour de LeftKnee
RightLeg       → pivot autour de RightHip
RightLowerLeg  → pivot autour de RightKnee

Head           → pivot autour de Neck

LeftEye        → scale verticale (clignement)
RightEye       → scale verticale (clignement)
LeftEyebrow    → translation verticale
RightEyebrow   → translation verticale
```

## Points clés

1. **Un seul pivot par groupe** : Chaque `<g id="...">` doit contenir **exactement un** `<circle>` ou `<ellipse>` avec un ID
2. **Position du pivot** : Le pivot doit être positionné au point d'articulation (cx, cy)
3. **Noms fixes** : Les IDs des groupes ET des pivots doivent correspondre exactement (voir tableau)
4. **Groupes à la même profondeur** : Tous les groupes de parties sont enfants directs du groupe racine
5. **Support de contenu** : Les groupes peuvent contenir plusieurs `<path>`, `<rect>`, `<g>` imbriqués - seul le pivot direct est utilisé
6. **Parties visage optionnelles** : `LeftEye`, `RightEye`, `LeftEyebrow`, `RightEyebrow` activent des sliders dedies dans l'inspecteur

## Exemple complet (minimum)

```xml
<svg viewBox="0 0 300 600">
  <g id="Character">
    <g id="Head">
      <path d="M..."/>
      <circle id="Neck" cx="150" cy="100" r="5"/>
    </g>
    
    <g id="LeftArm">
      <path d="M..."/>
      <circle id="LeftShoulder" cx="120" cy="150" r="5"/>
    </g>
    
    <g id="LeftForearm">
      <path d="M..."/>
      <circle id="LeftElbow" cx="100" cy="250" r="5"/>
    </g>
    
    <!-- ... autres parties ... -->
  </g>
</svg>
```

## Notes pour Inkscape/Illustrator

1. **Créez un groupe par partie anatomique** (Head, LeftArm, LeftForearm, etc.)
2. **Groupez votre géométrie** dans ces groupes
3. **Ajoutez un cercle/ellipse** au point d'articulation de chaque groupe
4. **Nommez précisément** : groupe ET cercle doivent avoir les bons IDs (voir tableau)
5. **Masquez PivotReference** : utilisez `display="none"` ou `visibility="hidden"`
6. **Exportez en SVG** avec les IDs préservés
