create table public.ratings (
  id bigint generated always as identity primary key,
  trip_id bigint references public.trips (id) on delete cascade not null,
  rater_id uuid references public.profiles (id) on delete cascade not null,
  ratee_id uuid references public.profiles (id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(trip_id, rater_id)
);

comment on table public.ratings is 'Stores two-way ratings between passengers and drivers for completed trips.';

create index ratings_trip_id_idx on public.ratings (trip_id);
create index ratings_rater_id_idx on public.ratings (rater_id);
create index ratings_ratee_id_idx on public.ratings (ratee_id);

alter table public.ratings enable row level security;
