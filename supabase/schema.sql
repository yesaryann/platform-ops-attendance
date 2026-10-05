create type schedule_status as enum ('office', 'remote', 'leave');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  initials text not null,
  accent text not null default '#f6b8a9'
);

create table public.schedules (
  user_id uuid not null references public.profiles(id) on delete cascade,
  schedule_date date not null,
  status schedule_status not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, schedule_date)
);

alter table public.profiles enable row level security;
alter table public.schedules enable row level security;

create policy "Authenticated users can view profiles"
  on public.profiles for select to authenticated using (true);
create policy "Authenticated users can view schedules"
  on public.schedules for select to authenticated using (true);
create policy "Users can insert their own schedules"
  on public.schedules for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own schedules"
  on public.schedules for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own schedules"
  on public.schedules for delete to authenticated using (auth.uid() = user_id);

-- These IDs must match the corresponding auth.users IDs.
insert into public.profiles (id, name, initials, accent) values
  ('76ddc257-e103-417a-8ffe-079fe1921ff7', 'Aryan Raj', 'AR', '#f6b8a9'),
  ('8fccfb62-f348-4096-9eab-327c2c7600da', 'Jha Avichal', 'JA', '#f5dc87'),
  ('fe1bd805-034e-42f0-b8aa-b5aa9557f937', 'Padihary Subas', 'PS', '#8ed7e8'),
  ('e7599df3-00f8-4326-a6de-7317fd3cce37', 'Rani Yalamaddi', 'RY', '#f5b8bb'),
  ('c606d480-bcb3-441a-8c95-6aed3da61ccb', 'Singh Hargovind', 'SH', '#d9d9d4'),
  ('c42313f7-8696-496a-880e-4bc840d7b916', 'Singh Khushbu', 'SK', '#a7dfbd'),
  ('09d99c04-b0b1-4cf2-98ec-038e1f56e0a9', 'Thakur Tanmaya', 'TT', '#ebb0c5')
on conflict (id) do update
set name = excluded.name,
    initials = excluded.initials,
    accent = excluded.accent;
