create table public.trip_waypoints (
  id bigint generated always as identity primary key,
  trip_id bigint references public.trips (id) on delete cascade not null,
  passenger_id uuid references public.profiles(id) on delete cascade not null,
  type public.waypoint_type not null,
  location extensions.geometry(point, 4326) not null,
  address text,
  sequence_order integer not null,
  status public.waypoint_status not null default 'pending',
  completed_at timestamp with time zone
);

comment on table public.trip_waypoints is 'Defines the ordered stops (pickups and dropoffs) for a trip to support ride-sharing.';

create index trip_waypoints_trip_id_idx on public.trip_waypoints (trip_id);
create index trip_waypoints_passenger_id_idx on public.trip_waypoints (passenger_id);
create index trip_waypoints_location_idx on public.trip_waypoints using gist (location);

alter table public.trip_waypoints enable row level security;
