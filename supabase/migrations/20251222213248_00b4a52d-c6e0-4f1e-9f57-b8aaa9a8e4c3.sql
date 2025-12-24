-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create interests enum
CREATE TYPE public.interest_category AS ENUM (
  'gaming', 'sports', 'music', 'movies', 'books', 'food', 
  'travel', 'technology', 'art', 'fitness', 'outdoors', 'other'
);

-- Create user interests table
CREATE TABLE public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interest_name TEXT NOT NULL,
  category interest_category DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, interest_name)
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Create meetup types enum
CREATE TYPE public.meetup_type AS ENUM ('friends', 'marketplace', 'interest');

-- Create meetups table
CREATE TABLE public.meetups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  meetup_type meetup_type NOT NULL,
  meeting_point_lat DOUBLE PRECISION,
  meeting_point_lng DOUBLE PRECISION,
  meeting_point_name TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create meetup participants table
CREATE TABLE public.meetup_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id UUID REFERENCES public.meetups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  availability JSONB,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(meetup_id, user_id)
);

-- Create user availability table for interest matching
CREATE TABLE public.user_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_location_lat DOUBLE PRECISION,
  default_location_lng DOUBLE PRECISION,
  availability_slots JSONB,
  max_travel_distance_km INTEGER DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User interests policies
CREATE POLICY "Interests are viewable by authenticated users" ON public.user_interests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own interests" ON public.user_interests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of" ON public.friendships
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Meetups policies
CREATE POLICY "Users can view meetups they're part of" ON public.meetups
  FOR SELECT TO authenticated USING (
    auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM public.meetup_participants WHERE meetup_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create meetups" ON public.meetups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their meetups" ON public.meetups
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their meetups" ON public.meetups
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Meetup participants policies
CREATE POLICY "Users can view participants of their meetups" ON public.meetup_participants
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.meetups WHERE id = meetup_id AND creator_id = auth.uid())
  );

CREATE POLICY "Meetup creators can add participants" ON public.meetup_participants
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.meetups WHERE id = meetup_id AND creator_id = auth.uid()) OR
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their participation" ON public.meetup_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User availability policies
CREATE POLICY "Users can view availability of others" ON public.user_availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own availability" ON public.user_availability
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meetups_updated_at BEFORE UPDATE ON public.meetups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_availability_updated_at BEFORE UPDATE ON public.user_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();