export const likert7 = [1, 2, 3, 4, 5, 6, 7].map((value) => ({ value }));
export const likert5 = [1, 2, 3, 4, 5].map((value) => ({ value }));

export function pidAutoItem() {
  return {
    id: 'pid',
    type: 'pidAuto',
    label: 'Identifiant participant',
    required: true,
    readOnly: true,
    help: 'Cet identifiant est récupéré automatiquement à partir de la base des étudiants : format NOMpreXX.',
  };
}

export function agreementLegend() {
  return {
    legendLeft: '1 = Pas du tout d\'accord',
    legendRight: '7 = Totalement d\'accord',
  };
}

export function truthLegend() {
  return {
    legendLeft: '1 = Totalement faux',
    legendRight: '7 = Totalement vrai',
  };
}

export function frequencyLegend() {
  return {
    legendLeft: '1 = Jamais',
    legendRight: '7 = Au quotidien',
  };
}

export function panasLegend() {
  return {
    legendLeft: '1 = Très peu ou pas du tout',
    legendRight: '5 = Extrêmement',
  };
}
