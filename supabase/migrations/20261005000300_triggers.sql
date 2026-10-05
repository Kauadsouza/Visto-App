-- =============================================================
-- Visto — 003: triggers
-- Mantém profiles em dia sem depender do cliente.
-- =============================================================

-- ---------- cria o profile automaticamente no signup ----------
-- Sem isso, cada novo usuário teria que inserir o próprio profile no primeiro
-- login, e qualquer falha ali deixaria o usuário sem linha em `profiles` —
-- o que cascade-ia para planos e registros_viagem.
--
-- security definer: o trigger roda com privilégio do dono da função (postgres),
-- então consegue inserir em `profiles` apesar da RLS, que só autoriza o
-- próprio usuário. O app não recebe nenhum privilégio extra por causa disso.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- updated_at automático ----------
-- `updated_at` tem default now(), mas isso só vale na inserção. Sem este
-- trigger a coluna mentiria sobre a última alteração real.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();