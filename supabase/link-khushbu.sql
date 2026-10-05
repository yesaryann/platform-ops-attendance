-- Run once in the Supabase SQL editor after creating
-- kushbu.singh@orange.com in Authentication.

do $$
declare
  auth_user_id uuid;
begin
  select id into auth_user_id
  from auth.users
  where lower(email) in ('kushbu.singh@orange.com', 'mail-kushbu.singh@orange.com');

  if auth_user_id is null then
    raise exception 'No Supabase Auth user found for the Khushbu email';
  end if;

  delete from public.profiles
  where name = 'Singh Khushbu'
    and id <> auth_user_id;

  insert into public.profiles (id, name, initials, accent)
  values (auth_user_id, 'Singh Khushbu', 'SK', '#a7dfbd')
  on conflict (id) do update
  set name = excluded.name,
      initials = excluded.initials,
      accent = excluded.accent;
end $$;
