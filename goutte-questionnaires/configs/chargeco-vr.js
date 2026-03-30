import { likert7Truth, pidItem } from './common.js';

const labels = [
  'Pour cette tâche, il fallait garder à l\'esprit plusieurs choses à la fois.',
  'Cette tâche était très complexe.',
  'Pour cette tâche, j\'ai dû m\'investir pleinement.',
  'Pour cette tâche, j\'ai dû réfléchir intensément pour comprendre le contenu.',
  'Pendant cette tâche, il était difficile de trouver le contenu important pour la comprendre.',
  'L\'environnement virtuel n\'était pas idéal pour apprendre.',
  'Pendant cette tâche, il était difficile d\'identifier et relier les informations me permettant d\'apprendre.'
];

export default {
  key: 'chargeco_vr',
  title: 'Test de la charge cognitive (Jeu / VR)',
  description: '1 = Totalement faux ; 7 = Totalement vrai.',
  items: [pidItem(true), ...labels.map((label, idx) => ({ id: `cc_${idx + 1}`, type: 'likert', label, required: true, options: likert7Truth }))],
  scales: [
    { key: 'icl', items: ['cc_1','cc_2'] },
    { key: 'gcl', items: ['cc_3','cc_4'] },
    { key: 'ecl', items: ['cc_5','cc_6','cc_7'] },
    { key: 'chargeco_total', items: ['cc_1','cc_2','cc_3','cc_4','cc_5','cc_6','cc_7'] }
  ]
};
