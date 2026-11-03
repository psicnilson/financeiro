import {createClient} from '@supabase/supabase-js';
import {readBackup} from './finance.js';
const localKey = 'minhas-financas-v1';
export function localStore() {
  function read() { const raw = localStorage.getItem(localKey); return raw === null ? [] : readBackup(raw); }
  function write(entries) { localStorage.setItem(localKey,JSON.stringify({version:1,entries})); }
  return {
    async list() { return read(); },
    async add(entry) { const entries = read(); if(entries.length >= 10000) throw new Error('Limite de 10.000 lançamentos atingido.'); write([...entries,entry]); },
    async remove(id) {write(read().filter(e=>e.id !== id));},
    async replace(entries) {read(); write(entries);}
  };
}
export function cloudStore(config) {
  const client = createClient(config.url,config.key);
  const columns = 'id,description,type,category,cents,date';
  const check = result => { if(result.error) throw new Error('Não foi possível concluir no banco. Confira a conexão e a configuração do Supabase.'); return result.data; };
  return {client, forUser(userId) {
    return {
      async list() {
        let entries=[];
        // Paginação: o Supabase limita respostas a 1.000 linhas por padrão.
        for(let offset=0;;offset+=500) {
          const batch = check(await client.from('entries').select(columns).eq('user_id',userId).order('id').range(offset,offset+499));
          entries.push(...batch);
          if (entries.length>10000) throw new Error('Mais de 10.000 registros: exporte os dados pelo Supabase.');
          if(batch.length<500) break;
        }
        return readBackup(JSON.stringify({version:1,entries}));
      },
      async add(entry) {check(await client.from('entries').insert({...entry,user_id:userId}));},
      async remove(id) {check(await client.from('entries').delete().eq('user_id',userId).eq('id',id));},
      async replace(entries) {check(await client.rpc('replace_my_entries',{new_entries:entries}));}
    };
  }};
}
