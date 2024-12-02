-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cover_image TEXT NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT playlists_name_not_empty CHECK (name <> '')
);

-- Create tracks table
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

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    profile_image TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create submissions table
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

-- Create approved_songs table
CREATE TABLE IF NOT EXISTS approved_songs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL REFERENCES artists(id),
    title VARCHAR(255) NOT NULL,
    audio_url TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_playlist_id ON tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_artist_id ON submissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_approved_songs_artist_id ON approved_songs(artist_id);

-- Enable RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artists
CREATE POLICY "Users can view all artists" 
    ON artists FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own artist profile" 
    ON artists FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artist profile" 
    ON artists FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policies for submissions
CREATE POLICY "Artists can view their own submissions" 
    ON submissions FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM artists 
            WHERE artists.id = submissions.artist_id 
            AND artists.user_id = auth.uid()
        )
    );

CREATE POLICY "Artists can create submissions" 
    ON submissions FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM artists 
            WHERE artists.id = artist_id 
            AND artists.user_id = auth.uid()
        )
    );

-- RLS Policies for approved_songs
CREATE POLICY "Everyone can view approved songs" 
    ON approved_songs FOR SELECT 
    TO authenticated
    USING (true);