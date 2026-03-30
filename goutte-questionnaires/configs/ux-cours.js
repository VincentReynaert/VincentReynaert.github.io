import { likert7Agreement, pidItem } from './common.js';

export default {
  key: 'ux_cours',
  title: 'Questionnaire d\'UX (Cours)',
  description: 'Échelle de 1 à 7.',
  items: [
    pidItem(true),
    { id: 'ux_1', type: 'likert', label: 'Suivre un cours magistral éveille ma curiosité.', required: true, options: likert7Agreement },
    { id: 'ux_2', type: 'likert', label: 'L\'apprentissage par cours magistral n\'est pas intéressant.', required: true, options: likert7Agreement },
    { id: 'ux_3', type: 'likert', label: 'Suivre un cours magistral n\'est pas motivant.', required: true, options: likert7Agreement },
    { id: 'ux_4', type: 'likert', label: 'Suivre un cours magistral est engageant (m\'incite à écouter et retenir les informations).', required: true, options: likert7Agreement },
    { id: 'ux_5', type: 'likert', label: 'Je n\'ai pas aimé suivre ce cours.', required: true, options: likert7Agreement },
    { id: 'ux_6', type: 'likert', label: 'J\'ai trouvé ce cours amusant à suivre.', required: true, options: likert7Agreement },
    { id: 'ux_7', type: 'likert', label: 'Ce cours ne m\'a pas diverti.', required: true, options: likert7Agreement },
    { id: 'ux_8', type: 'likert', label: 'Suivre un cours magistral sur la goutte m\'a donné envie de discuter de ce rhumatisme avec les autres étudiants.', required: true, options: likert7Agreement },
    { id: 'ux_9', type: 'likert', label: 'Après le cours, j\'ai discuté de la façon dont le professeur avait donné son cours.', required: true, options: likert7Agreement },
    { id: 'ux_10', type: 'likert', label: 'Après le cours, j\'ai eu envie de consulter à nouveau le contenu (PPT / prise de notes) pour mieux comprendre la goutte.', required: true, options: likert7Agreement }
  ],
  scales: [
    { key: 'ux_motivation', items: ['ux_1','ux_2','ux_3','ux_4'] },
    { key: 'ux_enjoyment', items: ['ux_5','ux_6','ux_7'] },
    { key: 'ux_intention', items: ['ux_8','ux_9','ux_10'] },
    { key: 'ux_total', items: ['ux_1','ux_2','ux_3','ux_4','ux_5','ux_6','ux_7','ux_8','ux_9','ux_10'] }
  ]
};
