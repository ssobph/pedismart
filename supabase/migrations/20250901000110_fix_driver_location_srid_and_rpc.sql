UPDATE public.drivers
SET current_location = ST_SetSRID(current_location, 4326)
WHERE current_location IS NOT NULL AND ST_SRID(current_location) = 0;

CREATE OR REPLACE FUNCTION update_driver_location(p_driver_id uuid, p_long float, p_lat float)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.drivers
  SET current_location = ST_SetSRID(ST_MakePoint(p_long, p_lat), 4326),
      updated_at = timezone('utc'::text, now())
  WHERE profile_id = p_driver_id;
$$;
