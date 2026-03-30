import { likert7, agreementLegend } from './common.js';

const labels = [
  'Je suis confiant dans ma capacité à diagnostiquer une crise de goutte.',
  'Je suis confiant dans ma capacité à expliquer la physiopathologie de la goutte.',
  'Je suis confiant dans ma capacité à énumérer les facteurs de comorbidité de la goutte.',
  'Je suis confiant dans ma capacité à expliquer l’épidémiologie de la goutte.',
  'Je suis confiant dans ma capacité à exposer les facteurs menant à un taux d’acide urique très élevé.',
  'Je suis confiant dans ma capacité à expliquer pourquoi l’acide urique se transforme en cristaux d’urate monosodique.',
  'Je suis confiant dans ma capacité à prendre en charge un patient atteint de la goutte.',
  'Je suis confiant dans ma capacité à expliquer tous les traitements de la goutte.',
  'Je suis confiant dans ma capacité à expliquer ce qu’est un tophus et son évolution clinique.',
];

export default {
  key: 'autoefficacy_pre',
  title: 'Questionnaire d’auto-efficacité — pré',
  description: 'Ce questionnaire va nous permettre d’évaluer votre sentiment d’efficacité personnelle concernant les contenus abordés sur la goutte. Pour cela, il vous suffit d’attribuer une note comprise entre 1 « Pas du tout d’accord » et 7 « Totalement d’accord » aux affirmations suivantes.',
  phase: 'phase1',
  requiresPid: true,
  items: labels.map((label, index) => ({ id: `ae_${index + 1}`, type: 'likert', label, required: true, options: likert7, ...agreementLegend() })),
  scales: [{ key: 'autoefficacy_pre', items: labels.map((_, index) => `ae_${index + 1}`) }],
};
