create table public.trips (
  id bigint generated always as identity primary key,
  passenger_id uuid references public.profiles (id) on delete set null,
  driver_id uuid references public.drivers (profile_id) on delete set null,
  status public.trip_status not null default 'requested',
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accepted_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone
);

comment on table public.trips is 'Records all ride-sharing trips and their status, linking passengers and drivers.';

create index trips_passenger_id_idx on public.trips (passenger_id);
create index trips_driver_id_idx on public.trips (driver_id);
create index trips_status_idx on public.trips (status);

alter table public.trips enable row level security;
