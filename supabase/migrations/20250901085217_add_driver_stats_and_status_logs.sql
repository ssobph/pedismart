CREATE TABLE IF NOT EXISTS public.driver_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('online', 'offline', 'on_trip')),
  changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_status_logs_driver_changed 
  ON public.driver_status_logs(driver_id, changed_at DESC);

ALTER TABLE public.driver_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can insert own status logs"
  ON public.driver_status_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view own status logs"
  ON public.driver_status_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE OR REPLACE FUNCTION log_driver_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR 
     (TG_OP = 'INSERT' AND NEW.status IS NOT NULL) THEN
    INSERT INTO public.driver_status_logs (driver_id, status, changed_at)
    VALUES (NEW.profile_id, NEW.status, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_driver_status
  AFTER INSERT OR UPDATE OF status ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION log_driver_status_change();

CREATE OR REPLACE FUNCTION get_driver_stats(
  p_driver_id uuid,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE (
  trips_completed integer,
  average_rating numeric,
  hours_online numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_start timestamptz;
  v_now timestamptz;
BEGIN
  IF p_driver_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access to driver stats';
  END IF;

  v_now := now();
  v_day_start := date_trunc('day', v_now AT TIME ZONE p_tz) AT TIME ZONE p_tz;

  RETURN QUERY
  WITH 
  
  trip_stats AS (
    SELECT COUNT(*)::integer as completed_trips
    FROM public.trips
    WHERE driver_id = p_driver_id
      AND status = 'completed'
  ),
  
  rating_stats AS (
    SELECT AVG(rating)::numeric(3,2) as avg_rating
    FROM public.ratings
    WHERE ratee_id = p_driver_id
  ),
  
  online_hours AS (
    WITH status_events AS (
      -- last status before today
      (
        SELECT 
          driver_id,
          status,
          changed_at,
          0 as event_order
        FROM public.driver_status_logs
        WHERE driver_id = p_driver_id
          AND changed_at < v_day_start
        ORDER BY changed_at DESC
        LIMIT 1
      )
      UNION ALL
      -- status changes today
      (
        SELECT 
          driver_id,
          status,
          changed_at,
          1 as event_order
        FROM public.driver_status_logs
        WHERE driver_id = p_driver_id
          AND changed_at >= v_day_start
          AND changed_at <= v_now
      )
      ORDER BY event_order, changed_at
    ),
    -- pair each online event with the next event 
    paired_events AS (
      SELECT 
        status,
        changed_at as start_time,
        COALESCE(
          LEAD(changed_at) OVER (ORDER BY changed_at),
          v_now
        ) as end_time
      FROM status_events
    ),
    online_intervals AS (
      SELECT 
        GREATEST(start_time, v_day_start) as interval_start,
        LEAST(end_time, v_now) as interval_end
      FROM paired_events
      WHERE status = 'online'
        AND end_time > v_day_start  -- Interval ends after day start
        AND start_time < v_now      -- Interval starts before now
    )
    SELECT 
      COALESCE(
        EXTRACT(EPOCH FROM SUM(interval_end - interval_start)) / 3600.0,
        0
      )::numeric(5,2) as hours
    FROM online_intervals
  )
  
  SELECT 
    COALESCE(t.completed_trips, 0),
    r.avg_rating,
    COALESCE(o.hours, 0.0)
  FROM trip_stats t
  CROSS JOIN rating_stats r
  CROSS JOIN online_hours o;
END;
$$;

GRANT EXECUTE ON FUNCTION get_driver_stats TO authenticated;