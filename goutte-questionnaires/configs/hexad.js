import { likert7Agreement, pidItem } from './common.js';

const items = [
  ['p1','P1. Cela me rend heureux de pouvoir aider les autres.'],
  ['f1','F1. Il est important pour moi de décider où je vais / ce que je fais.'],
  ['r4','R4. Si la récompense est suffisante, je ferai l\'effort nécessaire.'],
  ['d1','D1. J\'aime provoquer (avoir un côté provocateur).'],
  ['p2','P2. J\'aime aider (guider) les autres dans des situations nouvelles.'],
  ['f2','F2. Je me laisse souvent guider par ma curiosité.'],
  ['r1','R1. J\'aime les défis/compétitions où l\'on peut gagner un prix.'],
  ['a2','A2. Il est important pour moi de toujours accomplir mes tâches dans leur intégralité.'],
  ['a1','A1. J\'aime surmonter les obstacles (en général).'],
  ['r3','R3. Le retour sur investissement est important pour moi.'],
  ['f3','F3. J\'aime essayer de nouvelles choses.'],
  ['s4','S4. J\'aime les activités de groupe.'],
  ['p4','P4. Le bien-être des autres est important pour moi.'],
  ['d4','D4. Je n\'aime pas suivre les règles.'],
  ['s2','S2. J\'aime faire partie d\'une équipe.'],
  ['a4','A4. J\'aime maîtriser les tâches difficiles.'],
  ['d3','D3. Je me considère comme un rebelle.'],
  ['p3','P3. J\'aime partager mes connaissances.'],
  ['d2','D2. J\'aime remettre en question le statu quo (challenger une décision).'],
  ['s1','S1. Interagir avec les autres est important pour moi.'],
  ['a3','A3. J\'ai du mal à laisser tomber (abandonner) un problème avant d\'avoir trouvé une solution.'],
  ['r2','R2. Les récompenses sont un excellent moyen de me motiver.'],
  ['f4','F4. Être indépendant est important pour moi.']
].map(([id, label]) => ({ id, type: 'likert', label, required: true, options: likert7Agreement }));

export default {
  key: 'hexad',
  title: 'User Type Hexad',
  description: 'Questionnaire Hexad sur 6 profils motivationnels.',
  items: [pidItem(true), ...items],
  scales: [
    { key: 'philanthropist', items: ['p1','p2','p4','p3'] },
    { key: 'free_spirit', items: ['f1','f2','f3','f4'] },
    { key: 'achiever', items: ['a2','a1','a4','a3'] },
    { key: 'socialiser', items: ['s4','s2','s1'] },
    { key: 'disruptor', items: ['d1','d4','d3','d2'] },
    { key: 'player', items: ['r4','r1','r3','r2'] }
  ]
};
