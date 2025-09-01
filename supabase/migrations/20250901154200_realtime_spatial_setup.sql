create extension if not exists postgis;

alter publication supabase_realtime add table public.trips;

create index if not exists trip_waypoints_location_gix 
  on public.trip_waypoints 
  using gist (location);

create index if not exists trip_waypoints_type_idx 
  on public.trip_waypoints (type);

create index if not exists trips_requested_at_idx 
  on public.trips (requested_at);

do $$
begin
  if not exists (
    select 1 from pg_enum 
    where enumlabel = 'offered' 
    and enumtypid = (select oid from pg_type where typname = 'trip_status')
  ) then
    alter type trip_status add value 'offered';
  end if;

  if not exists (
    select 1 from pg_enum 
    where enumlabel = 'declined' 
    and enumtypid = (select oid from pg_type where typname = 'trip_status')
  ) then
    alter type trip_status add value 'declined';
  end if;
end$$;

create or replace function public.get_nearby_requests(
  driver_lat double precision,
  driver_lng double precision,
  radius_m integer,
  since timestamptz default now() - interval '10 minutes'
)
returns table (
  id bigint,
  passenger_id uuid,
  driver_id uuid,
  status trip_status,
  pickup_location jsonb,
  dropoff_location jsonb,
  requested_at timestamptz,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  distance_meters double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select 
    t.id,
    t.passenger_id,
    t.driver_id,
    t.status,
    extensions.ST_AsGeoJSON(pickup.location)::jsonb as pickup_location,
    extensions.ST_AsGeoJSON(dropoff.location)::jsonb as dropoff_location,
    t.requested_at,
    t.accepted_at,
    t.started_at,
    t.completed_at,
    t.cancelled_at,
    extensions.ST_Distance(
      pickup.location::extensions.geography,
      extensions.ST_SetSRID(extensions.ST_MakePoint(driver_lng, driver_lat), 4326)::extensions.geography
    ) as distance_meters
  from public.trips t
  left join public.trip_waypoints pickup 
    on t.id = pickup.trip_id and pickup.type = 'pickup'
  left join public.trip_waypoints dropoff 
    on t.id = dropoff.trip_id and dropoff.type = 'dropoff'
  where t.status = 'requested'
    and t.requested_at >= since
    and pickup.location is not null
    and extensions.ST_DWithin(
      pickup.location::extensions.geography,
      extensions.ST_SetSRID(extensions.ST_MakePoint(driver_lng, driver_lat), 4326)::extensions.geography,
      radius_m
    )
  order by t.requested_at desc;
$$;

create policy "drivers_can_read_requested_trips"
  on public.trips
  for select
  to authenticated
  using (status = 'requested');

create policy "drivers_can_create_offered_trips"
  on public.trips
  for insert
  to authenticated
  with check (auth.uid() = driver_id);

create policy "passengers_can_read_their_trips"
  on public.trips
  for select
  to authenticated
  using (auth.uid() = passenger_id);

create policy "passengers_can_respond_to_offered_trips"
  on public.trips
  for update
  to authenticated
  using (auth.uid() = passenger_id)
  with check (auth.uid() = passenger_id);

create policy "drivers_can_update_their_trips"
  on public.trips
  for update
  to authenticated
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

grant execute on function public.get_nearby_requests to authenticated;
