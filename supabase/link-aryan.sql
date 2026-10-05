-- Run this once in the Supabase SQL editor after creating
-- raj.aryan@orange.com in Authentication.
-- This links the Auth account to Aryan's team profile.

do $$
declare
  auth_user_id uuid;
begin
  select id into auth_user_id
  from auth.users
  where lower(email) = 'raj.aryan@orange.com';

  if auth_user_id is null then
    raise exception 'No Supabase Auth user found for raj.aryan@orange.com';
  end if;

  delete from public.profiles
  where name = 'Aryan Raj'
    and id <> auth_user_id;

  insert into public.profiles (id, name, initials, accent)
  values (auth_user_id, 'Aryan Raj', 'AR', '#f6b8a9')
  on conflict (id) do update
  set name = excluded.name,
      initials = excluded.initials,
      accent = excluded.accent;
end $$;
