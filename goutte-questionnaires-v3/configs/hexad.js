import { likert7, agreementLegend } from './common.js';
import { shuffle } from '../shared/utils.js';

const baseItems = [
  { id: 'a1', code: 'A1', label: 'J’aime surmonter les obstacles (en général).' },
  { id: 'a2', code: 'A2', label: 'Il est important pour moi de toujours accomplir mes tâches dans leur intégralité.' },
  { id: 'a3', code: 'A3', label: 'J’ai du mal à laisser tomber (abandonner) un problème avant d’avoir trouvé une solution.' },
  { id: 'a4', code: 'A4', label: 'J’aime maîtriser les tâches difficiles.' },
  { id: 'd1', code: 'D1', label: 'J’aime provoquer (avoir un côté provocateur).' },
  { id: 'd2', code: 'D2', label: 'J’aime remettre en question le statu quo (challenger une décision).' },
  { id: 'd3', code: 'D3', label: 'Je me considère comme un rebelle.' },
  { id: 'd4', code: 'D4', label: 'Je n’aime pas suivre les règles.' },
  { id: 'f1', code: 'F1', label: 'Il est important pour moi de décider où je vais / ce que je fais.' },
  { id: 'f2', code: 'F2', label: 'Je me laisse souvent guider par ma curiosité.' },
  { id: 'f3', code: 'F3', label: 'J’aime essayer de nouvelles choses.' },
  { id: 'f4', code: 'F4', label: 'Être indépendant est important pour moi.' },
  { id: 'p1', code: 'P1', label: 'Cela me rend heureux de pouvoir aider les autres.' },
  { id: 'p2', code: 'P2', label: 'J’aime aider (guider) les autres dans des situations nouvelles.' },
  { id: 'p3', code: 'P3', label: 'J’aime partager mes connaissances.' },
  { id: 'p4', code: 'P4', label: 'Le bien-être des autres est important pour moi.' },
  { id: 'r1', code: 'R1', label: 'J’aime les défis / compétitions où l’on peut gagner un prix.' },
  { id: 'r2', code: 'R2', label: 'Les récompenses sont un excellent moyen de me motiver.' },
  { id: 'r3', code: 'R3', label: 'Le retour sur investissement est important pour moi.' },
  { id: 'r4', code: 'R4', label: 'Si la récompense est suffisante, je ferai l’effort nécessaire.' },
  { id: 's1', code: 'S1', label: 'Interagir avec les autres est important pour moi.' },
  { id: 's2', code: 'S2', label: 'J’aime faire partie d’une équipe.' },
  { id: 's3', code: 'S3', label: 'Il est important pour moi de me sentir membre d’une communauté.' },
  { id: 's4', code: 'S4', label: 'J’aime les activités de groupe.' },
].map((item) => ({ ...item, type: 'likert', required: true, options: likert7, ...agreementLegend() }));

export default {
  key: 'hexad',
  title: 'Questionnaire HEXAD',
  description: 'Ce questionnaire va nous permettre de mieux comprendre ce que vous aimez dans une interaction digitale. Pour cela, il vous suffit d’attribuer une note comprise entre 1 « Pas du tout d’accord » et 7 « Totalement d’accord » aux affirmations suivantes.',
  phase: 'phase1',
  requiresPid: true,
  getItems(params) {
    const order = (params.order || 'code').toLowerCase();
    const items = [...baseItems];
    if (order === 'random') return shuffle(items);
    return items.sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  },
  scales: [
    { key: 'hexad_achiever', items: ['a1', 'a2', 'a3', 'a4'] },
    { key: 'hexad_disruptor', items: ['d1', 'd2', 'd3', 'd4'] },
    { key: 'hexad_free_spirit', items: ['f1', 'f2', 'f3', 'f4'] },
    { key: 'hexad_philanthropist', items: ['p1', 'p2', 'p3', 'p4'] },
    { key: 'hexad_player', items: ['r1', 'r2', 'r3', 'r4'] },
    { key: 'hexad_socialiser', items: ['s1', 's2', 's3', 's4'] },
  ],
};
