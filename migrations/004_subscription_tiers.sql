-- Add subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');

-- Add subscription status to user profiles
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

-- Add trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own usage" ON subscription_usage;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
    ON user_subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Add subscription usage tracking
CREATE TABLE IF NOT EXISTS subscription_usage (
    user_id UUID PRIMARY KEY,
    playlist_count INTEGER DEFAULT 0,
    song_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage"
    ON subscription_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Functions to manage usage tracking
CREATE OR REPLACE FUNCTION increment_playlist_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscription_usage (user_id, playlist_count)
    VALUES (NEW.user_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET playlist_count = subscription_usage.playlist_count + 1,
                  last_updated = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_playlist_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE subscription_usage
    SET playlist_count = GREATEST(0, playlist_count - 1),
        last_updated = TIMEZONE('utc', NOW())
    WHERE user_id = OLD.user_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_song_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscription_usage (user_id, song_count)
    VALUES ((SELECT user_id FROM playlists WHERE id = NEW.playlist_id), 1)
    ON CONFLICT (user_id)
    DO UPDATE SET song_count = subscription_usage.song_count + 1,
                  last_updated = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_song_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE subscription_usage
    SET song_count = GREATEST(0, song_count - 1),
        last_updated = TIMEZONE('utc', NOW())
    WHERE user_id = (SELECT user_id FROM playlists WHERE id = OLD.playlist_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for usage tracking
CREATE TRIGGER track_playlist_creation
    AFTER INSERT ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION increment_playlist_count();

CREATE TRIGGER track_playlist_deletion
    AFTER DELETE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION decrement_playlist_count();

CREATE TRIGGER track_song_addition
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION increment_song_count();

CREATE TRIGGER track_song_deletion
    AFTER DELETE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION decrement_song_count();