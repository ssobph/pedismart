ALTER TABLE public.trip_waypoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view waypoints of their own trips." ON public.trip_waypoints;
DROP POLICY IF EXISTS "Drivers can update waypoints on their trips." ON public.trip_waypoints;

CREATE POLICY "Users can view waypoints of their own trips."
  ON public.trip_waypoints FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM public.trips
      WHERE auth.uid() = passenger_id OR auth.uid() = driver_id
    )
  );

CREATE POLICY "Drivers can update waypoints on their trips."
  ON public.trip_waypoints FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM public.trips
      WHERE auth.uid() = driver_id
    )
  );
