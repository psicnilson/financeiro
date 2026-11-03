import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('PostgreSQL: RLS isola contas e importação preserva os dados em falhas',async t=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
   insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');`);
  const schema=await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8');
  await db.exec(schema);await db.exec(schema); // reexecução segura
  const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
  const entry={id:'same-id',description:'Teste',type:'income',category:'Outros',cents:100,date:'2026-11-03'};
  async function user(id){await db.exec('reset role; set role authenticated;');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
  await user(a);await db.query('select public.replace_my_entries($1::jsonb)',[JSON.stringify([entry])]);
  await user(b);await db.query('select public.replace_my_entries($1::jsonb)',[JSON.stringify([{...entry,cents:200}])]);
  await t.test('cada conta vê somente seu saldo, mesmo com IDs de backup iguais',async()=>{
   assert.equal((await db.query('select sum(cents)::int as total from public.entries')).rows[0].total,200);
   await user(a);assert.equal((await db.query('select sum(cents)::int as total from public.entries')).rows[0].total,100);
  });
  await t.test('não é possível inserir ou apagar lançamentos de outra conta',async()=>{
   await assert.rejects(db.query(`insert into public.entries (user_id,id,description,type,category,cents,date) values ($1,'attack','Teste','income','Outros',10,'2026-11-03')`,[b]));
   assert.equal((await db.query('delete from public.entries where user_id=$1 returning id',[b])).rows.length,0);
  });
  await t.test('backup inválido ou duplicado não apaga registros existentes',async()=>{
   for(const entries of [[{...entry,cents:-10}],[entry,entry],[{...entry,date:'2026-02-30'}],null,{}]) {
    await assert.rejects(db.query('select public.replace_my_entries($1::jsonb)',[JSON.stringify(entries)]));
    assert.equal((await db.query('select cents::int from public.entries')).rows[0].cents,100);
   }
  });
  await t.test('importação ignora user_id do arquivo e afeta somente o dono',async()=>{
   await db.query('select public.replace_my_entries($1::jsonb)',[JSON.stringify([{...entry,user_id:b,cents:300}])]);
   assert.equal((await db.query('select user_id,cents::int from public.entries')).rows[0].user_id,a);
   await user(b);assert.equal((await db.query('select cents::int from public.entries')).rows[0].cents,200);
  });
  await t.test('visitantes não leem dados nem executam importações',async()=>{
   await db.exec('reset role;set role anon;');
   await assert.rejects(db.query('select * from public.entries'));
   await assert.rejects(db.query("select public.replace_my_entries('[]'::jsonb)"));
  });
 }finally{await db.close();}
});
