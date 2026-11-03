import {categories, parseAmount, validEntry, readBackup, totals, monthEntries} from './finance.js';
const $ = id => document.getElementById(id);
const key = 'minhas-financas-v1';
const money = cents => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(cents / 100);
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
$('month').value = today.slice(0,7);
$('date').value = today;
for (const category of categories) $('category').add(new Option(category, category));
$('category').value = 'Outros';
let entries = [];
let storageBlocked = false;
function message(text) { $('status').textContent = text; }
try {
  const saved = localStorage.getItem(key);
  if (saved !== null) entries = readBackup(saved);
} catch {
  storageBlocked = true;
  message('Não foi possível ler os dados salvos. Para evitar sobrescrevê-los, novos registros estão bloqueados. Exporte ou recupere seu backup antes de continuar.');
}
function save(next) {
  if (storageBlocked) { message('O armazenamento não pôde ser lido. Seus dados originais foram preservados.'); return false; }
  try { localStorage.setItem(key, JSON.stringify({version:1, entries:next})); entries = next; return true; }
  catch { message('Não foi possível salvar. Verifique o espaço e as permissões do navegador. O lançamento não foi alterado.'); return false; }
}
function render() {
  const current = monthEntries(entries, $('month').value).sort((a,b) => b.date.localeCompare(a.date));
  const summary = totals(current);
  for (const k of ['income', 'expense', 'balance']) $(k).textContent = money(summary[k]);
  $('entries').replaceChildren();
  $('empty').hidden = current.length > 0;
  $('count').textContent = `${current.length} lançamento${current.length === 1 ? '' : 's'}`;
  for (const e of current) {
    const row = document.createElement('tr');
    const desc = document.createElement('td'); desc.textContent = e.description;
    const category = document.createElement('small'); category.textContent = `${e.category} · ${e.type === 'income' ? 'Receita' : 'Despesa'}`; desc.append(category);
    const date = document.createElement('td'); date.textContent = e.date.split('-').reverse().join('/');
    const amount = document.createElement('td'); amount.className = e.type; amount.textContent = `${e.type === 'income' ? '+' : '−'} ${money(e.cents)}`;
    const action = document.createElement('td'); const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete'; remove.textContent = 'Excluir'; remove.setAttribute('aria-label', `Excluir ${e.description}`);
    remove.onclick = () => { if (confirm(`Excluir “${e.description}”?`) && save(entries.filter(item => item.id !== e.id))) { render(); message('Lançamento excluído.'); } };
    action.append(remove); row.append(desc,date,amount,action); $('entries').append(row);
  }
}
$('month').onchange = render;
$('entry-form').onsubmit = event => {
  event.preventDefault();
  try {
    if (entries.length >= 10000) throw new Error('Limite de 10.000 lançamentos atingido.');
    const entry = {id: crypto.randomUUID(), description:$('description').value.trim(), type:$('type').value, category:$('category').value, cents:parseAmount($('amount').value), date:$('date').value};
    if (!validEntry(entry)) throw new Error('Confira a descrição, a data e o valor.');
    if (save([...entries, entry])) { $('month').value = entry.date.slice(0,7); $('description').value = ''; $('amount').value = ''; render(); message('Lançamento salvo.'); $('description').focus(); }
  } catch (error) { message(error.message); }
};
$('export').onclick = () => {
  if (storageBlocked) { message('Não é possível exportar os dados porque a leitura do armazenamento falhou.'); return; }
  const url = URL.createObjectURL(new Blob([JSON.stringify({version:1, entries}, null, 2)], {type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = `minhas-financas-${today}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Backup exportado. Guarde o arquivo em um local seguro.');
};
$('import').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 5000000) throw new Error('O backup deve ter até 5 MB.');
    const next = readBackup(await file.text());
    if (!confirm(`Substituir os ${entries.length} registros atuais pelos ${next.length} registros do backup? Exporte os dados atuais antes se quiser mantê-los.`)) return;
    if (save(next)) { render(); message('Backup importado. Selecione o mês dos registros para consultá-los.'); }
  } catch { message('Não foi possível importar. Use um backup válido exportado por este aplicativo (até 5 MB).'); }
  finally { event.target.value = ''; }
};
render();
