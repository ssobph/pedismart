ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see ratings they are involved in." ON public.ratings;
DROP POLICY IF EXISTS "Participants can rate each other on completed trips." ON public.ratings;

CREATE POLICY "Users can see ratings they are involved in."
  ON public.ratings FOR SELECT
  USING (auth.uid() = rater_id OR auth.uid() = ratee_id);

CREATE POLICY "Participants can rate each other on completed trips."
  ON public.ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id AND
    trip_id IN (
      SELECT id FROM public.trips
      WHERE
        status = 'completed' AND
        (auth.uid() = passenger_id OR auth.uid() = driver_id)
    )
  );
