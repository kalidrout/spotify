-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create base tables
CREATE TABLE IF NOT EXISTS playlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cover_image TEXT NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT playlists_name_not_empty CHECK (name <> '')
);

CREATE TABLE IF NOT EXISTS tracks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    duration VARCHAR(10) NOT NULL,
    album_art TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT tracks_title_not_empty CHECK (title <> ''),
    CONSTRAINT tracks_artist_not_empty CHECK (artist <> '')
);

CREATE TABLE IF NOT EXISTS artists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS approved_songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id),
    title VARCHAR(255) NOT NULL,
    audio_url TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create subscription related tables
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');

CREATE TABLE IF NOT EXISTS user_subscriptions (
    user_id UUID PRIMARY KEY,
    tier subscription_tier DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscription_usage (
    user_id UUID PRIMARY KEY,
    playlist_count INTEGER DEFAULT 0,
    song_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create staff management tables
CREATE TABLE IF NOT EXISTS staff_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discord_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_playlist_id ON tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_artist_id ON submissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_approved_songs_artist_id ON approved_songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_discord_id ON staff_members(discord_id);
CREATE INDEX IF NOT EXISTS idx_staff_actions_staff_id ON staff_actions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_actions_submission_id ON staff_actions(submission_id);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_actions ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS policies
CREATE OR REPLACE FUNCTION is_playlist_owner(playlist_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM playlists 
        WHERE id = playlist_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_artist_owner(artist_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM artists 
        WHERE id = artist_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff_member()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM staff_members 
        WHERE discord_id = auth.jwt()->>'discord_id'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
-- Playlists
CREATE POLICY "Users can view their own playlists"
    ON playlists FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own playlists"
    ON playlists FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Tracks
CREATE POLICY "Users can view tracks in their playlists"
    ON tracks FOR SELECT
    TO authenticated
    USING (playlist_id IN (
        SELECT id FROM playlists WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage tracks in their playlists"
    ON tracks FOR ALL
    TO authenticated
    USING (playlist_id IN (
        SELECT id FROM playlists WHERE user_id = auth.uid()
    ));

-- Artists
CREATE POLICY "Users can view all artists"
    ON artists FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage their own artist profile"
    ON artists FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Submissions
CREATE POLICY "Artists can view their own submissions"
    ON submissions FOR SELECT
    TO authenticated
    USING (artist_id IN (
        SELECT id FROM artists WHERE user_id = auth.uid()
    ));

CREATE POLICY "Artists can create submissions"
    ON submissions FOR INSERT
    TO authenticated
    WITH CHECK (artist_id IN (
        SELECT id FROM artists WHERE user_id = auth.uid()
    ));

-- Approved Songs
CREATE POLICY "Everyone can view approved songs"
    ON approved_songs FOR SELECT
    TO authenticated
    USING (true);

-- Staff Actions
CREATE POLICY "Staff can view all actions"
    ON staff_actions FOR SELECT
    TO authenticated
    USING (is_staff_member());

CREATE POLICY "Staff can create actions"
    ON staff_actions FOR INSERT
    TO authenticated
    WITH CHECK (is_staff_member());

-- Subscription Management
CREATE POLICY "Users can view their own subscription"
    ON user_subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own usage"
    ON subscription_usage FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Enable realtime subscriptions for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE playlists;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE approved_songs;

COMMENT ON TABLE playlists IS 'User created playlists';
COMMENT ON TABLE tracks IS 'Songs within playlists';
COMMENT ON TABLE artists IS 'Artist profiles';
COMMENT ON TABLE submissions IS 'Song submissions from artists';
COMMENT ON TABLE approved_songs IS 'Approved song submissions';
COMMENT ON TABLE staff_members IS 'Staff member information';
COMMENT ON TABLE staff_actions IS 'Log of staff member actions';

-- Create plays tracking table
CREATE TABLE IF NOT EXISTS plays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    song_id UUID NOT NULL REFERENCES approved_songs(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plays_user_id ON plays(user_id);
CREATE INDEX IF NOT EXISTS idx_plays_song_id ON plays(song_id);

ALTER TABLE plays ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can play songs
CREATE OR REPLACE FUNCTION can_play_songs()
RETURNS boolean AS $$
BEGIN
    -- Free users can play songs
    -- You might want to add additional checks here for premium features
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for plays
CREATE POLICY "Users can record their own plays"
    ON plays FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        AND can_play_songs()
    );

CREATE POLICY "Users can view their play history"
    ON plays FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Add realtime for plays
ALTER PUBLICATION supabase_realtime ADD TABLE plays;

COMMENT ON TABLE plays IS 'Track user song plays'; 