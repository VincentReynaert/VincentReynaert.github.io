import { likert5Intensity, pidItem } from './common.js';

const labels = ['Intéressé','Perturbé','Excité','Bouleversé','Fort','Coupable','Apeuré','Hostile','Enthousiaste','Fier','Irritable','Vigilant','Honteux','Inspiré','Nerveux','Déterminé','Attentif','Agité','Actif','Effrayé'];
const positive = ['pa_1','pa_3','pa_5','pa_9','pa_10','pa_12','pa_14','pa_16','pa_17','pa_19'];
const negative = ['pa_2','pa_4','pa_6','pa_7','pa_8','pa_11','pa_13','pa_15','pa_18','pa_20'];

export default {
  key: 'panas',
  title: 'Positive and Negative Affect Schedule (PANAS)',
  description: '1 = Très peu ou pas du tout ; 5 = Extrêmement.',
  items: [pidItem(true), ...labels.map((label, idx) => ({ id: `pa_${idx + 1}`, type: 'likert', label, required: true, options: likert5Intensity }))],
  scales: [
    { key: 'panas_pa', items: positive },
    { key: 'panas_na', items: negative }
  ]
};
