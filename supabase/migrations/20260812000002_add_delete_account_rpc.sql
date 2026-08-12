-- Function to allow a user to delete their own account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Delete the user from auth.users
  -- Because user_profiles and user_devices have ON DELETE CASCADE,
  -- this will automatically clean up the user's data.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
