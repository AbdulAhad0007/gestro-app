ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS local_ip TEXT;
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS os_version TEXT;
