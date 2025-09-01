CREATE OR REPLACE FUNCTION nearby_passengers(
  lat float, 
  long float, 
  radius_meters float
)
RETURNS TABLE (
  trip_id bigint,
  passenger_id uuid,
  passenger_name text,
  pickup_location extensions.geometry,
  pickup_address text,
  requested_at timestamptz,
  distance_meters float
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.id AS trip_id,
    t.passenger_id,
    p.full_name AS passenger_name,
    w.location AS pickup_location,
    w.address AS pickup_address,
    t.requested_at,
    ST_Distance(
      w.location, 
      ST_Point(long, lat)::extensions.geometry
    ) AS distance_meters
  FROM public.trips AS t
  JOIN public.profiles AS p ON t.passenger_id = p.id
  JOIN public.trip_waypoints AS w ON t.id = w.trip_id
  WHERE
    t.status = 'requested' AND
    w.type = 'pickup' AND
    ST_DWithin(
      w.location,
      ST_Point(long, lat)::extensions.geometry,
      radius_meters
    )
  ORDER BY distance_meters ASC;
$$;

GRANT EXECUTE ON FUNCTION nearby_passengers TO authenticated;
