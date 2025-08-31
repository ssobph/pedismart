CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'full_name', NEW.full_name,
      'username', NEW.username
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth_metadata();

CREATE OR REPLACE TRIGGER on_profile_updated
  AFTER UPDATE OF full_name, username ON public.profiles
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name OR OLD.username IS DISTINCT FROM NEW.username)
  EXECUTE FUNCTION public.sync_profile_to_auth_metadata();