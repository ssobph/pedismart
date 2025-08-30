create table public.drivers (
  profile_id uuid references public.profiles (id) on delete cascade not null primary key,
  plate_number text not null unique,
  vehicle_details text,
  status public.driver_status not null default 'offline',
  current_location extensions.geometry(point, 4326),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.drivers is 'Contains driver-specific information, including their vehicle and real-time status.';

create index drivers_current_location_idx on public.drivers using gist (current_location);

alter table public.drivers enable row level security;
