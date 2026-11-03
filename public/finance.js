export const categories = ['Salário', 'Renda extra', 'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'];
export function parseAmount(value) {
  if (!/^\d{1,9}(,\d{1,2})?$/.test(value.trim())) throw new Error('Informe um valor como 150,50, sem pontos.');
  const [whole, fraction = ''] = value.trim().split(',');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents <= 0) throw new Error('O valor deve ser maior que zero.');
  return cents;
}
export function validEntry(e) {
  if (!e || typeof e !== 'object') return false;
  const parsedDate = new Date(typeof e.date === 'string' ? e.date + 'T12:00:00Z' : NaN);
  const date = Number.isFinite(parsedDate.getTime()) && typeof e.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number(e.date.slice(0, 4)) >= 1900 && parsedDate.toISOString().slice(0, 10) === e.date;
  return typeof e.id === 'string' && e.id.length > 0 && e.id.length <= 100 && typeof e.description === 'string' && e.description.trim().length > 0 && e.description.length <= 100 && ['income', 'expense'].includes(e.type) && categories.includes(e.category) && Number.isSafeInteger(e.cents) && e.cents > 0 && e.cents <= 99999999999 && Boolean(date);
}
export function readBackup(text) {
  const data = JSON.parse(text);
  if (!data || data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 10000 || !data.entries.every(validEntry) || new Set(data.entries.map(e => e.id)).size !== data.entries.length) throw new Error('Arquivo de backup inválido.');
  return data.entries.map(({id, description, type, category, cents, date}) => ({id, description, type, category, cents, date}));
}
export function totals(entries) {
  const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.cents, 0);
  const expense = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.cents, 0);
  return {income, expense, balance: income - expense};
}
export function monthEntries(entries, month) { return entries.filter(e => e.date.slice(0, 7) === month); }
