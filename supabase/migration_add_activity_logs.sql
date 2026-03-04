create table public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_name text not null,
  calories_burned integer not null,
  created_at timestamptz default now()
);

alter table public.activity_logs enable row level security;

create policy "Users can view their own activity logs" 
on public.activity_logs for select 
using ( auth.uid() = user_id );

create policy "Users can insert their own activity logs" 
on public.activity_logs for insert 
with check ( auth.uid() = user_id );

create policy "Users can delete their own activity logs" 
on public.activity_logs for delete 
using ( auth.uid() = user_id );
