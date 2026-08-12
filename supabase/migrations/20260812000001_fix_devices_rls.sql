-- Update RLS policies to support custom JWTs minted by the edge function
-- The custom JWT stores the user_id in the 'sub' claim.

DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_devices;

CREATE POLICY "Users can manage their own devices"
  ON public.user_devices FOR ALL
  USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'sub')::uuid = user_id
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'sub')::uuid = user_id
  );
