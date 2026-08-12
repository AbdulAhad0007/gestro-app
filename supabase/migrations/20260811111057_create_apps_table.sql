-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_name VARCHAR(255) NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gesture_mappings table
CREATE TABLE IF NOT EXISTS public.gesture_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gesture_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_value VARCHAR(255) NOT NULL,
    app_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gesture_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for applications
CREATE POLICY "Users can manage their own applications"
ON public.applications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for gesture_mappings
CREATE POLICY "Users can manage their own gesture mappings"
ON public.gesture_mappings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
