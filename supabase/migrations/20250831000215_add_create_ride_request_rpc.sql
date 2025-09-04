CREATE OR REPLACE FUNCTION create_ride_request(
  p_passenger_id uuid,
  p_pickup_location jsonb,
  p_dropoff_location jsonb
)
RETURNS TABLE (
  id bigint,
  passenger_id uuid,
  driver_id uuid,
  status public.trip_status,
  requested_at timestamptz,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  new_trip_id bigint;
  active_trip_count integer;
BEGIN
  -- Check for existing active trips (requested, accepted, or in_progress)
  SELECT COUNT(*) INTO active_trip_count
  FROM public.trips
  WHERE passenger_id = p_passenger_id
    AND status IN ('requested', 'accepted', 'in_progress');

  -- If there's an active trip, raise an exception
  IF active_trip_count > 0 THEN
    RAISE EXCEPTION 'Cannot create ride request: User already has an active trip'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.trips (passenger_id, status)
  VALUES (p_passenger_id, 'requested')
  RETURNING public.trips.id INTO new_trip_id;

  INSERT INTO public.trip_waypoints (trip_id, passenger_id, type, location, sequence_order)
  VALUES
    (new_trip_id, p_passenger_id, 'pickup', ST_GeomFromGeoJSON(p_pickup_location), 1),
    (new_trip_id, p_passenger_id, 'dropoff', ST_GeomFromGeoJSON(p_dropoff_location), 2);

  RETURN QUERY SELECT * FROM public.trips WHERE public.trips.id = new_trip_id;
END;
$$;
