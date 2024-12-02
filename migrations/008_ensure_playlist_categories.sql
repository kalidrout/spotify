-- Check if the categories table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Check if the playlist_categories table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS playlist_categories (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY (playlist_id, category_id)
);

-- Add some default categories if they don't exist
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

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_playlist_categories_category_id ON playlist_categories(category_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
DROP POLICY IF EXISTS "Everyone can view playlist categories" ON playlist_categories;
DROP POLICY IF EXISTS "Playlist owners can manage categories" ON playlist_categories;

-- Create RLS Policies
CREATE POLICY "Everyone can view categories" 
    ON categories FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Everyone can view playlist categories" 
    ON playlist_categories FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Playlist owners can manage categories" 
    ON playlist_categories FOR ALL 
    TO authenticated 
    USING (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );