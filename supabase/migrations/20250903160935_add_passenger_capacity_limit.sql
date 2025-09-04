CREATE OR REPLACE FUNCTION check_passenger_capacity()
  RETURNS TRIGGER AS $$
DECLARE
  current_passenger_count INTEGER;
  max_capacity INTEGER := 6;
BEGIN
  -- current passengers for this trip (excluding cancelled ones)
  SELECT COUNT(*)
  INTO current_passenger_count
  FROM public.trip_passengers
  WHERE trip_id = NEW.trip_id
    AND status != 'cancelled';

  -- if adding this passenger would exceed capacity
  IF current_passenger_count >= max_capacity THEN
    RAISE EXCEPTION 'Cannot add passenger: Maximum capacity of % passengers reached', max_capacity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger to enforce passenger capacity on insert
DROP TRIGGER IF EXISTS enforce_passenger_capacity_trigger ON public.trip_passengers;
CREATE TRIGGER enforce_passenger_capacity_trigger
  BEFORE INSERT ON public.trip_passengers
  FOR EACH ROW
  EXECUTE FUNCTION check_passenger_capacity();

COMMENT ON FUNCTION check_passenger_capacity() IS 'Enforces maximum passenger capacity of 6 per trip';
