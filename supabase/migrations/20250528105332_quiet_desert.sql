/*
  # Initial Schema Setup for GrantMatch

  1. New Tables
    - `profiles`
      - Extends auth.users with additional user data
      - Stores user type (founder/dao_funder) and related info
      - Includes wallet address for Web3 integration
    - `votes`
      - Records votes from dao_funders to founders
      - Tracks token amounts and timestamps
    - `nfts`
      - Stores NFT metadata and badge info
      - Links to user profiles
    - `funding_rounds`
      - Tracks completed funding rounds
      - Records token distributions

  2. Security
    - Enable RLS on all tables
    - Add policies for secure data access
    - Ensure proper role-based restrictions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('founder', 'dao_funder')),
  wallet_address TEXT UNIQUE,
  email TEXT NOT NULL,
  female_flag BOOLEAN,
  region TEXT,
  mission TEXT,
  applied_grants_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_amount BIGINT NOT NULL CHECK (token_amount > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(voter_id, founder_id)
);

-- Create nfts table
CREATE TABLE IF NOT EXISTS nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata_uri TEXT NOT NULL,
  champion_badge BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create funding_rounds table
CREATE TABLE IF NOT EXISTS funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_awarded BIGINT NOT NULL CHECK (tokens_awarded > 0),
  round_ended_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only dao_funders can create votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'dao_funder'
    )
  );

-- NFTs policies
CREATE POLICY "Anyone can read NFTs"
  ON nfts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own NFTs"
  ON nfts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Funding rounds policies
CREATE POLICY "Anyone can read funding rounds"
  ON funding_rounds
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to check if user is dao_funder
CREATE OR REPLACE FUNCTION is_dao_funder()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'dao_funder'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;