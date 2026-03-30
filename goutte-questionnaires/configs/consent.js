import { likert7Agreement } from './common.js';

export default {
  key: 'consent',
  title: 'Formulaire de participation libre et éclairé',
  description: 'Formulaire de consentement et de profil participant.',
  items: [
    { id: 'full_name', type: 'text', label: 'Nom et prénom', required: true },
    { id: 'pid', type: 'text', label: 'Identifiant', required: true, placeholder: 'Ex. P001' },
    { id: 'age', type: 'text', label: 'Âge', required: true, inputType: 'number' },
    { id: 'sex', type: 'singleChoice', label: 'Sexe', required: true, options: [
      { value: 'homme', label: 'Homme' },
      { value: 'femme', label: 'Femme' },
      { value: 'autre', label: 'Autre / préfère ne pas répondre' }
    ]},
    { id: 'vr_contraindication', type: 'singleChoice', label: 'Avez-vous une contre-indication médicale à utiliser la réalité virtuelle ?', required: true, options: [
      { value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }
    ]},
    { id: 'vr_frequency', type: 'likert', label: 'À quelle fréquence utilisez-vous la réalité virtuelle ?', help: '1 = jamais ; 7 = au quotidien', required: true, options: likert7Agreement },
    { id: 'game_frequency', type: 'likert', label: 'À quelle fréquence jouez-vous aux jeux vidéo ?', help: '1 = jamais ; 7 = au quotidien', required: true, options: likert7Agreement }
  ]
};
