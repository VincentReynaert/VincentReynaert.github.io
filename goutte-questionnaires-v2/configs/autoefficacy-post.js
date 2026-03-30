import preConfig from './autoefficacy-pre.js';

export default {
  ...preConfig,
  key: 'autoefficacy_post',
  title: 'Questionnaire d’auto-efficacité — post',
  description: 'Ce questionnaire va nous permettre d’évaluer votre sentiment d’efficacité personnelle concernant les contenus abordés sur la goutte. Pour cela, il vous suffit d’attribuer une note comprise entre 1 « Pas du tout d’accord » et 7 « Totalement d’accord » aux affirmations suivantes.',
  phase: 'phase2',
  scales: [{ key: 'autoefficacy_post', items: preConfig.items.map((item) => item.id) }],
};
