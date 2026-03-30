import { likert7Agreement, pidItem } from './common.js';

const gamificationOptions = [
  'La narration (le fait d\'avoir créé une histoire pour le cours)',
  'Les questions à choix multiples',
  'L\'environnement (le fait d\'être dans un vaisseau spatial)',
  'La frise chronologique (qui vous permet de récapituler les points importants)',
  'La récompense (médaille)',
  'Interaction avec l\'environnement (tirer avec le pistolet/injecteur, prendre des objets)'
];

export default {
  key: 'ux_vr',
  title: 'Questionnaire d\'UX (Jeu / VR)',
  description: 'Échelle de 1 à 7.',
  items: [
    pidItem(true),
    { id: 'ux_1', type: 'likert', label: 'L\'apprentissage par réalité virtuelle éveille ma curiosité.', required: true, options: likert7Agreement },
    { id: 'ux_2', type: 'likert', label: 'L\'apprentissage par réalité virtuelle n\'est pas intéressant.', required: true, options: likert7Agreement },
    { id: 'ux_3', type: 'likert', label: 'Suivre un cours de cette manière n\'est pas motivant.', required: true, options: likert7Agreement },
    { id: 'ux_4', type: 'likert', label: 'Suivre un cours de cette manière est engageant (m\'incite à écouter et retenir les informations).', required: true, options: likert7Agreement },
    { id: 'ux_5', type: 'likert', label: 'Je n\'ai pas aimé suivre ce cours en réalité virtuelle.', required: true, options: likert7Agreement },
    { id: 'ux_6', type: 'likert', label: 'J\'ai trouvé ce cours amusant à suivre.', required: true, options: likert7Agreement },
    { id: 'ux_7', type: 'likert', label: 'Ce cours ne m\'a pas diverti.', required: true, options: likert7Agreement },
    { id: 'ux_8', type: 'likert', label: 'Ce cours en réalité virtuelle m\'a donné envie de discuter de ce rhumatisme (goutte) avec les autres étudiants.', required: true, options: likert7Agreement },
    { id: 'ux_9', type: 'likert', label: 'Après le cours, j\'ai discuté de mon expérience en réalité virtuelle avec les autres étudiants.', required: true, options: likert7Agreement },
    { id: 'ux_10', type: 'likert', label: 'Après le cours, j\'ai eu envie de réaliser à nouveau l\'expérience en réalité virtuelle pour mieux comprendre la goutte.', required: true, options: likert7Agreement },
    { id: 'gamif_useful', type: 'sortable', label: 'Classez les éléments suivants du plus utile au moins utile selon vous', required: true, options: gamificationOptions },
    { id: 'gamif_preference', type: 'sortable', label: 'Classez les éléments suivants selon un ordre de préférence', required: true, options: gamificationOptions }
  ],
  scales: [
    { key: 'ux_motivation', items: ['ux_1','ux_2','ux_3','ux_4'] },
    { key: 'ux_enjoyment', items: ['ux_5','ux_6','ux_7'] },
    { key: 'ux_intention', items: ['ux_8','ux_9','ux_10'] },
    { key: 'ux_total', items: ['ux_1','ux_2','ux_3','ux_4','ux_5','ux_6','ux_7','ux_8','ux_9','ux_10'] }
  ]
};
