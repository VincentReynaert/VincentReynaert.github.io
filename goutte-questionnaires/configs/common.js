export const likert7Agreement = [1,2,3,4,5,6,7].map((v) => ({ value: v, label: '' }));
export const likert7Truth = [1,2,3,4,5,6,7].map((v) => ({ value: v, label: '' }));
export const likert5Intensity = [1,2,3,4,5].map((v) => ({ value: v, label: '' }));

export function pidItem(required = true) {
  return { id: 'pid', type: 'text', label: 'Identifiant', required, placeholder: 'Ex. P001' };
}
