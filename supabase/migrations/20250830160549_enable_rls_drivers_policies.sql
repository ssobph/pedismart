ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can see online drivers." ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update their own driver data." ON public.drivers;

CREATE POLICY "Authenticated users can see online drivers."
  ON public.drivers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Drivers can update their own driver data."
  ON public.drivers FOR UPDATE
  USING (auth.uid() = profile_id);
