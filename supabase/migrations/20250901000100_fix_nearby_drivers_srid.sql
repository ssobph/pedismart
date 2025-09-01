CREATE OR REPLACE FUNCTION nearby_drivers(lat float, long float, radius_meters float)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  plate_number text,
  current_location extensions.geometry,
  distance_meters float
)
LANGUAGE sql
AS $$
  WITH origin AS (
    SELECT ST_SetSRID(ST_MakePoint(long, lat), 4326) AS geom
  )
  SELECT
    d.profile_id,
    p.full_name,
    d.plate_number,
    d.current_location,
    ST_Distance(d.current_location::geography, (SELECT geom FROM origin)::geography) AS distance_meters
  FROM public.drivers AS d
  JOIN public.profiles AS p ON d.profile_id = p.id
  WHERE
    d.status = 'online'
    AND d.current_location IS NOT NULL
    AND ST_DWithin(
      d.current_location::geography,
      (SELECT geom FROM origin)::geography,
      radius_meters
    )
  ORDER BY distance_meters;
$$;
