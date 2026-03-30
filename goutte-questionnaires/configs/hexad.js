import { likert7Agreement, pidItem } from './common.js';

const items = [
  ['a1','J\'aime surmonter les obstacles (en général).'],
  ['a2','Il est important pour moi de toujours accomplir mes tâches dans leur intégralité.'],
  ['a3','J\'ai du mal à laisser tomber (abandonner) un problème avant d\'avoir trouvé une solution.'],
  ['a4','J\'aime maîtriser les tâches difficiles.'],
  ['f1','Il est important pour moi de décider où je vais / ce que je fais.'],
  ['f2','Je me laisse souvent guider par ma curiosité.'],
  ['f3','J\'aime essayer de nouvelles choses.'],
  ['f4','Être indépendant est important pour moi.'],
  ['d1','J\'aime provoquer (avoir un côté provocateur).'],
  ['d2','J\'aime remettre en question le statu quo (challenger une décision).'],
  ['d3','Je me considère comme un rebelle.'],
  ['d4','Je n\'aime pas suivre les règles.'],
  ['p1','Cela me rend heureux de pouvoir aider les autres.'],
  ['p2','J\'aime aider (guider) les autres dans des situations nouvelles.'],
  ['p3','J\'aime partager mes connaissances.'],
  ['p4','Le bien-être des autres est important pour moi.'],
  ['r1','J\'aime les défis/compétitions où l\'on peut gagner un prix.'],
  ['r2','Les récompenses sont un excellent moyen de me motiver.'],
  ['r3','Le retour sur investissement est important pour moi.'],
  ['r4','Si la récompense est suffisante, je ferai l\'effort nécessaire.'],
  ['s1','Interagir avec les autres est important pour moi.'],
  ['s2','J\'aime faire partie d\'une équipe.'],
  ['s3','Il est important pour moi de me sentir membre d\'une communauté.'],
  ['s4','J\'aime les activités de groupe.']
].map(([id, label]) => ({ id, type: 'likert', label, required: true, options: likert7Agreement }));

export default {
  key: 'hexad',
  title: 'User Type Hexad',
  description: 'Questionnaire Hexad sur 6 profils motivationnels.',
  items: [pidItem(true), ...items],
  scales: [
    { key: 'philanthropist', items: ['p1','p2','p3','p4'] },
    { key: 'free_spirit', items: ['f1','f2','f3','f4'] },
    { key: 'achiever', items: ['a1','a2','a3','a4'] },
    { key: 'socialiser', items: ['s1','s2','s3','s4'] },
    { key: 'disruptor', items: ['d1','d2','d3','d4'] },
    { key: 'player', items: ['r1','r2','r3','r4'] }
  ]
};
