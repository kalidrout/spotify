-- Drop existing policies that might use set-returning functions
DROP POLICY IF EXISTS "Artists can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Artists can create submissions" ON submissions;
DROP POLICY IF EXISTS "Staff can view all actions" ON staff_actions;
DROP POLICY IF EXISTS "Staff can create actions" ON staff_actions;
DROP POLICY IF EXISTS "Playlist owners can manage categories" ON playlist_categories;
DROP POLICY IF EXISTS "Playlist owners can manage collaborators" ON playlist_collaborators;

-- Recreate policies without set-returning functions
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

CREATE POLICY "Staff can view all actions"
    ON staff_actions FOR SELECT
    TO authenticated
    USING (
        auth.jwt()->>'discord_id' IN (
            SELECT discord_id FROM staff_members
        )
    );

CREATE POLICY "Staff can create actions"
    ON staff_actions FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt()->>'discord_id' IN (
            SELECT discord_id FROM staff_members
        )
    );

CREATE POLICY "Playlist owners can manage categories"
    ON playlist_categories FOR ALL
    TO authenticated
    USING (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Playlist owners can manage collaborators"
    ON playlist_collaborators FOR ALL
    TO authenticated
    USING (
        playlist_id IN (
            SELECT id FROM playlists WHERE user_id = auth.uid()
        )
    );

-- Add indexes to improve policy performance
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_discord_id ON staff_members(discord_id);

-- Function to validate owner policies
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

-- Function to validate artist policies
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

-- Function to validate staff membership
CREATE OR REPLACE FUNCTION is_staff_member()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM staff_members 
        WHERE discord_id = auth.jwt()->>'discord_id'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_playlist_owner IS 'Check if the current user owns the specified playlist';
COMMENT ON FUNCTION is_artist_owner IS 'Check if the current user owns the specified artist profile';
COMMENT ON FUNCTION is_staff_member IS 'Check if the current user is a staff member';