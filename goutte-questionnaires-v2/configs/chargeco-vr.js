import { likert7, truthLegend } from './common.js';

const labels = [
  'Pour cette tâche, il fallait garder à l’esprit plusieurs choses à la fois.',
  'Cette tâche était très complexe.',
  'Pour cette tâche, j’ai dû m’investir pleinement.',
  'Pour cette tâche, j’ai dû réfléchir intensément pour comprendre le contenu.',
  'Pendant cette tâche, il était difficile de trouver le contenu important pour la comprendre.',
  'L’environnement virtuel n’était pas idéal pour apprendre.',
  'Pendant cette tâche, il était difficile d’identifier et relier les informations me permettant d’apprendre.',
];

export default {
  key: 'chargeco_vr',
  title: 'Test de la charge cognitive — VR / Jeu',
  description: 'Ce questionnaire va nous permettre d’évaluer la charge cognitive ressentie pendant l’activité en réalité virtuelle. Pour cela, il vous suffit d’attribuer une note comprise entre 1 « Totalement faux » et 7 « Totalement vrai » aux affirmations suivantes.',
  phase: 'phase2',
  requiresPid: true,
  items: labels.map((label, index) => ({ id: `cc_${index + 1}`, type: 'likert', label, required: true, options: likert7, ...truthLegend() })),
  scales: [
    { key: 'chargeco_icl', items: ['cc_1', 'cc_2'] },
    { key: 'chargeco_gcl', items: ['cc_3', 'cc_4'] },
    { key: 'chargeco_ecl', items: ['cc_5', 'cc_6', 'cc_7'] },
    { key: 'chargeco_total', items: ['cc_1', 'cc_2', 'cc_3', 'cc_4', 'cc_5', 'cc_6', 'cc_7'] },
  ],
};
