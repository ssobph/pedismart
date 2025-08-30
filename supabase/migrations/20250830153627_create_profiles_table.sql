create table public.profiles (
  id uuid references auth.users (id) on delete cascade not null primary key,
  full_name text not null,
  avatar_url text,
  role public.user_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.profiles is 'Stores public user profiles, extending auth.users with data like full name and role.';

alter table public.profiles enable row level security;
