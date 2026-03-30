import { likert7, pidAutoItem, frequencyLegend } from './common.js';

export default {
  key: 'consent',
  title: 'Formulaire de participation libre et éclairé',
  description: 'Ce formulaire nous permet de recueillir votre consentement et quelques informations de contexte utiles à l’étude. Les réponses sont utilisées uniquement dans le cadre de cette expérimentation.',
  phase: 'phase1',
  requiresPid: false,
  items: [
    {
      id: 'consent_ack',
      type: 'checkbox',
      label: 'Consentement',
      checkboxLabel: 'En renseignant vos nom et prénom, vous déclarez avoir pris connaissance des informations ci-dessus et accepter de participer à cette étude.',
      required: true,
    },
    { id: 'last_name', type: 'text', label: 'Nom', required: true, placeholder: 'Ex. DUPONT' },
    { id: 'first_name', type: 'text', label: 'Prénom', required: true, placeholder: 'Ex. Alice' },
    pidAutoItem(),
    { id: 'age', type: 'text', inputType: 'number', label: 'Âge', required: true, placeholder: 'Ex. 23' },
    {
      id: 'sex',
      type: 'singleChoice',
      label: 'Quel est le sexe indiqué sur votre carte d’identité ?',
      required: true,
      options: [
        { value: 'homme', label: 'Homme' },
        { value: 'femme', label: 'Femme' },
      ],
    },
    {
      id: 'vr_contraindication',
      type: 'singleChoice',
      label: 'Avez-vous une contre-indication médicale à l’utilisation de la réalité virtuelle ?',
      required: true,
      options: [
        { value: 'oui', label: 'Oui' },
        { value: 'non', label: 'Non' },
      ],
    },
    {
      id: 'vr_frequency',
      type: 'likert',
      label: 'À quelle fréquence utilisez-vous la réalité virtuelle ?',
      required: true,
      options: likert7,
      ...frequencyLegend(),
    },
    {
      id: 'game_frequency',
      type: 'likert',
      label: 'À quelle fréquence jouez-vous aux jeux vidéo ?',
      required: true,
      options: likert7,
      ...frequencyLegend(),
    },
  ],
};
