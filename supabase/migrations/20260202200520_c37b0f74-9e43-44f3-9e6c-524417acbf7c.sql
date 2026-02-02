-- Create plan enum type
CREATE TYPE public.user_plan AS ENUM ('free', 'creator', 'pro');

-- Add plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN plan public.user_plan NOT NULL DEFAULT 'free';

-- Create a function to get the daily limit based on plan
CREATE OR REPLACE FUNCTION public.get_plan_daily_limit(p_plan public.user_plan)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'free' THEN 20
    WHEN 'creator' THEN 200
    WHEN 'pro' THEN 1000
    ELSE 20
  END;
$$;

-- Create a function to update user plan (callable from frontend)
CREATE OR REPLACE FUNCTION public.update_user_plan(new_plan public.user_plan)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    plan = new_plan,
    daily_generation_limit = get_plan_daily_limit(new_plan),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;