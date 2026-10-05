-- Run once in the Supabase SQL editor.
-- This synchronizes the seven team profiles to their actual Auth UUIDs
-- using email addresses, so schedule foreign keys and edit permissions work.

with team_members(email, name, initials, accent) as (
  values
    ('raj.aryan@orange.com', 'Aryan Raj', 'AR', '#f6b8a9'),
    ('avichal.jha@orange.com', 'Jha Avichal', 'JA', '#f5dc87'),
    ('subas.padhihary@orange.com', 'Padihary Subas', 'PS', '#8ed7e8'),
    ('yalamaddisaritha.rani.ext@orange.com', 'Rani Yalamaddi', 'RY', '#f5b8bb'),
    ('hargovind.singh@orange.com', 'Singh Hargovind', 'SH', '#d9d9d4'),
    ('khushbu.singh.ext@orange.com', 'Singh Khushbu', 'SK', '#a7dfbd'),
    ('tanmaya.thakur@orange.com', 'Thakur Tanmaya', 'TT', '#ebb0c5')
)
insert into public.profiles (id, name, initials, accent)
select users.id, team.name, team.initials, team.accent
from team_members team
join auth.users users on lower(users.email) = team.email
on conflict (id) do update
set name = excluded.name,
    initials = excluded.initials,
    accent = excluded.accent;

-- Remove the old placeholder rows after the new UUID rows exist.
delete from public.profiles old_profile
where old_profile.id not in (
  select users.id
  from auth.users users
  where lower(users.email) in (
    'raj.aryan@orange.com',
    'avichal.jha@orange.com',
    'subas.padhihary@orange.com',
    'yalamaddisaritha.rani.ext@orange.com',
    'hargovind.singh@orange.com',
    'khushbu.singh.ext@orange.com',
    'tanmaya.thakur@orange.com'
  )
)
and old_profile.name in (
  'Aryan Raj',
  'Jha Avichal',
  'Padihary Subas',
  'Rani Yalamaddi',
  'Singh Hargovind',
  'Singh Khushbu',
  'Thakur Tanmaya'
);
