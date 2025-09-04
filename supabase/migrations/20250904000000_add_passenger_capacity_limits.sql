-- Add passenger capacity validation at database level
-- This provides an additional layer of protection against exceeding the 6-passenger limit

-- Function to check passenger capacity before allowing new passengers
CREATE OR REPLACE FUNCTION check_passenger_capacity()
  RETURNS TRIGGER AS $$
DECLARE
  current_passenger_count INTEGER;
  max_capacity INTEGER := 6;
BEGIN
  -- Count current passengers for this trip (excluding cancelled ones)
  SELECT COUNT(*)
  INTO current_passenger_count
  FROM public.trip_passengers
  WHERE trip_id = NEW.trip_id
    AND status != 'cancelled';

  -- Check if adding this passenger would exceed capacity
  IF current_passenger_count >= max_capacity THEN
    RAISE EXCEPTION 'Cannot add passenger: Maximum capacity of % passengers reached', max_capacity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce passenger capacity on insert
DROP TRIGGER IF EXISTS enforce_passenger_capacity_trigger ON public.trip_passengers;
CREATE TRIGGER enforce_passenger_capacity_trigger
  BEFORE INSERT ON public.trip_passengers
  FOR EACH ROW
  EXECUTE FUNCTION check_passenger_capacity();

-- Add a comment to document the capacity limit
COMMENT ON FUNCTION check_passenger_capacity() IS 'Enforces maximum passenger capacity of 6 per trip';
