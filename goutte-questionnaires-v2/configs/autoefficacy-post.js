import preConfig from './autoefficacy-pre.js';

export default {
  ...preConfig,
  key: 'autoefficacy_post',
  title: 'Questionnaire d’auto-efficacité — post',
  phase: 'phase2',
  scales: [{ key: 'autoefficacy_post', items: preConfig.items.map((item) => item.id) }],
};
