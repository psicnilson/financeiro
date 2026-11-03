-- Execute este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- Os registros pertencem a auth.users e só podem ser acessados pelo dono.
begin;
create table if not exists public.entries (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 100),
  description text not null check (char_length(btrim(description)) between 1 and 100),
  type text not null check (type in ('income','expense')),
  category text not null check (category in ('Salário','Renda extra','Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Outros')),
  cents bigint not null check (cents between 1 and 99999999999),
  date date not null check (date between date '1900-01-01' and date '9999-12-31'),
  primary key (user_id,id)
);
alter table public.entries enable row level security;
revoke all on public.entries from anon, authenticated;
grant usage on schema public to authenticated;
grant select,insert,delete on public.entries to authenticated;
drop policy if exists own_entries_select on public.entries;
create policy own_entries_select on public.entries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists own_entries_insert on public.entries;
create policy own_entries_insert on public.entries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists own_entries_delete on public.entries;
create policy own_entries_delete on public.entries for delete to authenticated using ((select auth.uid()) = user_id);

-- Uma importação é uma única transação: se um registro for inválido,
-- nenhum lançamento anterior será apagado. Nunca aceita user_id do arquivo.
create or replace function public.replace_my_entries(new_entries jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Autenticação necessária'; end if;
  if jsonb_typeof(new_entries) is distinct from 'array' then raise exception 'Backup inválido'; end if;
  if jsonb_array_length(new_entries) > 10000 then raise exception 'Máximo de 10000 registros'; end if;
  delete from public.entries where user_id = auth.uid();
  insert into public.entries (user_id,id,description,type,category,cents,date)
    select auth.uid(),e.id,e.description,e.type,e.category,e.cents,e.date
    from jsonb_to_recordset(new_entries) as e(id text,description text,type text,category text,cents bigint,date date);
end;
$$;
revoke all on function public.replace_my_entries(jsonb) from public,anon;
grant execute on function public.replace_my_entries(jsonb) to authenticated;
commit;
