import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAmount, totals, monthEntries, readBackup, validEntry} from '../public/finance.js';
const entry = {id:'a', description:'Mercado', type:'expense', category:'Alimentação', cents:1050, date:'2026-11-02'};
test('Valores em centavos evitam erros e rejeitam formatos ambíguos', () => {
  assert.equal(parseAmount('10,50'), 1050);
  assert.equal(parseAmount('0,01'), 1);
  for (const value of ['0','-2','1.000,00','1.50','10,999','abc','Infinity']) assert.throws(() => parseAmount(value));
});
test('Resumo considera apenas o mês escolhido e separa receita de despesa', () => {
  const entries = [entry, {...entry,id:'b',type:'income',cents:2000}, {...entry,id:'c',date:'2026-10-01',cents:500}];
  assert.deepEqual(totals(monthEntries(entries, '2026-11')), {income:2000,expense:1050,balance:950});
  assert.deepEqual(totals([]), {income:0,expense:0,balance:0});
});
test('Backup preserva dados e rejeita registros inválidos ou duplicados', () => {
  assert.deepEqual(readBackup(JSON.stringify({version:1,entries:[entry]})),[entry]);
  for (const entries of [[{...entry,cents:-1}], [{...entry,date:'2026-02-30'}], [{...entry,date:'2026-99-30'}], [entry,entry], [{...entry,type:'invalid'}]]) assert.throws(() => readBackup(JSON.stringify({version:1,entries})));
  assert.equal(validEntry({...entry,date:'2024-02-29'}), true);
  assert.throws(() => readBackup('{}'));
});
