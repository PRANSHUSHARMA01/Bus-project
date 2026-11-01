-- Migration 001: Initial Supabase Schema for Smart Bus Tracking
-- Production-ready schema with Row-Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    role TEXT NOT NULL DEFAULT 'passenger' CHECK (role IN ('passenger', 'conductor', 'admin')),
    home_stop_id TEXT,
    work_stop_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. Saved Places Table
CREATE TABLE IF NOT EXISTS public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    stop_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved places"
    ON public.saved_places FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_places_user_created 
    ON public.saved_places (user_id, created_at DESC);

-- 3. Trips Table (Activity & Travel History)
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bus_id INTEGER NOT NULL,
    route_id TEXT NOT NULL,
    board_stop_id TEXT NOT NULL,
    alight_stop_id TEXT,
    boarded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    alighted_at TIMESTAMPTZ,
    distance_km NUMERIC(6, 2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    source TEXT NOT NULL DEFAULT 'live' CHECK (source IN ('demo', 'live'))
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own trips"
    ON public.trips FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trips_user_boarded 
    ON public.trips (user_id, boarded_at DESC);

-- 4. Notification Subscriptions (Arrival Alerts)
CREATE TABLE IF NOT EXISTS public.notifications_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bus_id INTEGER NOT NULL,
    stop_id TEXT NOT NULL,
    minutes_before INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    fired_at TIMESTAMPTZ
);

ALTER TABLE public.notifications_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own arrival subscriptions"
    ON public.notifications_subscriptions FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_created 
    ON public.notifications_subscriptions (user_id, created_at DESC);

-- 5. Emergency SOS Events
CREATE TABLE IF NOT EXISTS public.sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    bus_id INTEGER,
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    status TEXT NOT NULL DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'acknowledged', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own SOS events"
    ON public.sos_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert SOS events"
    ON public.sos_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 6. Recent Searches Table
CREATE TABLE IF NOT EXISTS public.recent_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    stop_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.recent_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own searches"
    ON public.recent_searches FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recent_searches_user_created 
    ON public.recent_searches (user_id, created_at DESC);

-- 7. Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 8. Trigger to Automatically Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    display_name TEXT;
BEGIN
    display_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );

    INSERT INTO public.profiles (id, full_name, email, avatar_url, language, role)
    VALUES (
        new.id,
        display_name,
        new.email,
        new.raw_user_meta_data->>'avatar_url',
        'en',
        'passenger'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
