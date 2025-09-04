CREATE OR REPLACE FUNCTION nearby_drivers(lat float, long float, radius_meters float)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  plate_number text,
  current_location extensions.geometry,
  distance_meters float,
  average_rating numeric
)
LANGUAGE sql
AS $$
  SELECT
    d.profile_id,
    p.full_name,
    d.plate_number,
    d.current_location,
    ST_Distance(d.current_location, ST_Point(long, lat)::extensions.geometry) AS distance_meters,
    COALESCE(rs.avg_rating, 0) as average_rating
  FROM public.drivers AS d
  JOIN public.profiles AS p ON d.profile_id = p.id
  LEFT JOIN (
    SELECT 
      ratee_id, 
      AVG(rating) as avg_rating
    FROM public.ratings
    GROUP BY ratee_id
  ) as rs ON d.profile_id = rs.ratee_id
  WHERE
    d.status = 'online' AND
    ST_DWithin(
      d.current_location,
      ST_Point(long, lat)::extensions.geometry,
      radius_meters
    )
  ORDER BY distance_meters, average_rating DESC;
$$;