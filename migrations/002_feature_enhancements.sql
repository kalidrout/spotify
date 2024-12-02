-- Enable UUID extension (in case it wasn't enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'dark',
    autoplay BOOLEAN DEFAULT true,
    private_profile BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create playlist_collaborators table
CREATE TABLE IF NOT EXISTS playlist_collaborators (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    permissions VARCHAR(20) DEFAULT 'edit' CHECK (permissions IN ('view', 'edit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (playlist_id, user_id)
);

-- Create track_likes table
CREATE TABLE IF NOT EXISTS track_likes (
    user_id UUID NOT NULL,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (user_id, track_id)
);

-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create track_comments table
CREATE TABLE IF NOT EXISTS track_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT track_comments_content_not_empty CHECK (content <> '')
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create playlist_categories table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS playlist_categories (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (playlist_id, category_id)
);

-- Add some default categories
INSERT INTO categories (name, description) VALUES
    ('Pop', 'Popular mainstream music'),
    ('Rock', 'Rock and alternative music'),
    ('Hip Hop', 'Hip hop and rap music'),
    ('Electronic', 'Electronic and dance music'),
    ('Classical', 'Classical and orchestral music'),
    ('Jazz', 'Jazz and blues music'),
    ('Folk', 'Folk and acoustic music'),
    ('Metal', 'Heavy metal and hard rock music')
ON CONFLICT (name) DO NOTHING;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_track_likes_user_id ON track_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_track_id ON track_comments(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_categories_category_id ON playlist_categories(category_id);

-- Enable Row Level Security on new tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
    ON user_preferences FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
    ON user_preferences FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- RLS Policies for playlist_collaborators
CREATE POLICY "Users can view collaborations" 
    ON playlist_collaborators FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Playlist owners can manage collaborators" 
    ON playlist_collaborators FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- RLS Policies for track_likes
CREATE POLICY "Users can view all likes" 
    ON track_likes FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can manage their own likes" 
    ON track_likes FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows" 
    ON user_follows FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can manage their own follows" 
    ON user_follows FOR ALL 
    TO authenticated 
    USING (auth.uid() = follower_id);

-- RLS Policies for track_comments
CREATE POLICY "Users can view all comments" 
    ON track_comments FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Users can manage their own comments" 
    ON track_comments FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Everyone can view categories" 
    ON categories FOR SELECT 
    TO authenticated 
    USING (true);

-- RLS Policies for playlist_categories
CREATE POLICY "Everyone can view playlist categories" 
    ON playlist_categories FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Playlist owners can manage categories" 
    ON playlist_categories FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_id 
            AND playlists.user_id = auth.uid()
        )
    );

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_track_comments_updated_at
    BEFORE UPDATE ON track_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();