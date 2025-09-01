create table if not exists public.trip_passengers (
  id bigserial primary key,
  trip_id bigint not null references public.trips(id) on delete cascade,
  passenger_id uuid not null references auth.users(id),
  status text not null default 'pending', -- pending | picked_up | dropped_off | cancelled
  inserted_at timestamptz not null default now()
);

create index if not exists trip_passengers_trip_idx on public.trip_passengers (trip_id);
create index if not exists trip_passengers_passenger_idx on public.trip_passengers (passenger_id);

alter table public.trip_waypoints
  add column if not exists passenger_id uuid references auth.users(id),
  add column if not exists kind text default 'pickup', -- pickup | dropoff
  add column if not exists order_index integer;

create index if not exists trip_waypoints_trip_order_idx on public.trip_waypoints (trip_id, order_index);

create policy "drivers_can_add_passengers_to_their_trips"
  on public.trip_passengers
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips 
      where id = trip_id 
        and driver_id = auth.uid()
        and status in ('accepted', 'in_progress')
    )
  );

create policy "drivers_can_read_their_trip_passengers"
  on public.trip_passengers
  for select
  to authenticated
  using (
    exists (
      select 1 from public.trips 
      where id = trip_id 
        and driver_id = auth.uid()
    )
  );

create policy "passengers_can_read_their_trip_records"
  on public.trip_passengers
  for select
  to authenticated
  using (passenger_id = auth.uid());

create policy "drivers_can_update_passenger_status"
  on public.trip_passengers
  for update
  to authenticated
  using (
    exists (
      select 1 from public.trips 
      where id = trip_id 
        and driver_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips 
      where id = trip_id 
        and driver_id = auth.uid()
    )
  );

alter table public.trip_passengers enable row level security;

create policy "drivers_can_add_waypoints_for_passengers"
  on public.trip_waypoints
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips 
      where id = trip_id 
        and driver_id = auth.uid()
        and status in ('accepted', 'in_progress', 'offered')
    )
  );

grant all on public.trip_passengers to authenticated;
grant usage on sequence public.trip_passengers_id_seq to authenticated;
