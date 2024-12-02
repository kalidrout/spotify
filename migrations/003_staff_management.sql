-- Create staff_members table
CREATE TABLE IF NOT EXISTS staff_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discord_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add staff actions log
CREATE TABLE IF NOT EXISTS staff_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_staff_members_discord_id ON staff_members(discord_id);
CREATE INDEX IF NOT EXISTS idx_staff_actions_staff_id ON staff_actions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_actions_submission_id ON staff_actions(submission_id);

-- Enable RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_members
CREATE POLICY "Public users can view staff members"
    ON staff_members FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for staff_actions
CREATE POLICY "Staff can view all actions"
    ON staff_actions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff_members
            WHERE staff_members.discord_id = auth.jwt()->>'discord_id'
        )
    );

CREATE POLICY "Staff can create actions"
    ON staff_actions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM staff_members
            WHERE staff_members.discord_id = auth.jwt()->>'discord_id'
        )
    );

-- Add some allowed Discord IDs (replace these with actual Discord IDs)
INSERT INTO staff_members (discord_id, username, avatar_url) VALUES
    ('123456789', 'Admin1', 'https://cdn.discordapp.com/avatars/123456789/example1.png'),
    ('987654321', 'Admin2', 'https://cdn.discordapp.com/avatars/987654321/example2.png')
ON CONFLICT (discord_id) DO NOTHING;