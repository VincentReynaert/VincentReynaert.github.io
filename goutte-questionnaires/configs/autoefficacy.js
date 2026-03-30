import { likert7Agreement, pidItem } from './common.js';

const labels = [
  'Je suis confiant dans ma capacité à diagnostiquer une crise de goutte.',
  'Je suis confiant dans ma capacité à expliquer la physiopathologie de la goutte.',
  'Je suis confiant dans ma capacité à énumérer les facteurs de comorbidité de la goutte.',
  'Je suis confiant dans ma capacité à expliquer l\'épidémiologie de la goutte.',
  'Je suis confiant dans ma capacité à exposer les facteurs menant à un taux d\'acide urique très élevé.',
  'Je suis confiant dans ma capacité à expliquer pourquoi l\'acide urique se transforme en cristaux d\'urate monosodique.',
  'Je suis confiant dans ma capacité à prendre en charge un patient atteint de la goutte.',
  'Je suis confiant dans ma capacité à expliquer tous les traitements de la goutte.',
  'Je suis confiant dans ma capacité à expliquer ce qu\'est un tophus et son évolution clinique.'
];

export default {
  key: 'autoefficacy',
  title: 'Questionnaire d\'auto-efficacité',
  description: '1 = Pas du tout d\'accord ; 7 = Totalement d\'accord.',
  items: [
    pidItem(true),
    ...labels.map((label, idx) => ({ id: `ae_${idx + 1}`, type: 'likert', label, required: true, options: likert7Agreement }))
  ],
  scales: [{ key: 'autoefficacy', items: labels.map((_, idx) => `ae_${idx + 1}`) }]
};
