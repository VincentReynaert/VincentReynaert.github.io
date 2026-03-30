import { likert5, panasLegend } from './common.js';

const labels = ['Intéressé', 'Perturbé', 'Excité', 'Bouleversé', 'Fort', 'Coupable', 'Apeuré', 'Hostile', 'Enthousiaste', 'Fier', 'Irritable', 'Vigilant', 'Honteux', 'Inspiré', 'Nerveux', 'Déterminé', 'Attentif', 'Agité', 'Actif', 'Effrayé'];

export default {
  key: 'panas',
  title: 'Questionnaire PANAS',
  description: 'Ce questionnaire va nous permettre de mesurer l’intensité des émotions et sentiments ressentis à cet instant. Pour cela, il vous suffit d’attribuer une note comprise entre 1 « Très peu ou pas du tout » et 5 « Extrêmement » aux mots suivants.',
  phase: 'phase2',
  requiresPid: true,
  items: labels.map((label, index) => ({ id: `pa_${index + 1}`, type: 'likert', label, required: true, options: likert5, ...panasLegend() })),
  scales: [
    { key: 'panas_positive', items: ['pa_1', 'pa_3', 'pa_5', 'pa_9', 'pa_10', 'pa_12', 'pa_14', 'pa_16', 'pa_17', 'pa_19'] },
    { key: 'panas_negative', items: ['pa_2', 'pa_4', 'pa_6', 'pa_7', 'pa_8', 'pa_11', 'pa_13', 'pa_15', 'pa_18', 'pa_20'] },
  ],
};
