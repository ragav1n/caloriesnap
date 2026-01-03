-- 1. Create a table for User Profiles
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  daily_calorie_goal integer default 2000,
  protein_goal integer default 150, -- in grams
  carbs_goal integer default 250,   -- in grams
  fats_goal integer default 70,     -- in grams
  
  primary key (id)
);

-- 2. Create a table for Food Logs
create table public.logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  food_name text not null,
  calories integer not null,
  protein integer default 0,
  carbs integer default 0,
  fats integer default 0,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.logs enable row level security;

-- 4. Create RLS Policies for 'profiles'
create policy "Users can view their own profile" 
on public.profiles for select 
using ( auth.uid() = id );

create policy "Users can update their own profile" 
on public.profiles for update 
using ( auth.uid() = id );

-- 5. Create RLS Policies for 'logs'
create policy "Users can view their own logs" 
on public.logs for select 
using ( auth.uid() = user_id );

create policy "Users can insert their own logs" 
on public.logs for insert 
with check ( auth.uid() = user_id );

create policy "Users can delete their own logs" 
on public.logs for delete 
using ( auth.uid() = user_id );

-- 6. Set up a Trigger to auto-create a profile on Sign Up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
