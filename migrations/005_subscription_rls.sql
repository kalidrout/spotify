-- Enable RLS on subscription tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user_subscriptions
CREATE POLICY "Users can update their own subscription"
    ON user_subscriptions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policies for subscription_usage
CREATE POLICY "Users can view their own usage"
    ON subscription_usage FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
    ON subscription_usage FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Insert default records for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (new.id, 'free');
  
  INSERT INTO public.subscription_usage (user_id, playlist_count, song_count)
  VALUES (new.id, 0, 0);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();