ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view trips they are part of." ON public.trips;
DROP POLICY IF EXISTS "Passengers can create their own trips." ON public.trips;
DROP POLICY IF EXISTS "Users can update trips they are part of." ON public.trips;

CREATE POLICY "Users can view trips they are part of."
  ON public.trips FOR SELECT
  USING (auth.uid() = passenger_id OR auth.uid() = driver_id);

CREATE POLICY "Passengers can create their own trips."
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update trips they are part of."
  ON public.trips FOR UPDATE
  USING (auth.uid() = passenger_id OR auth.uid() = driver_id);
