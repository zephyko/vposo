-- Fix search path for get_plan_daily_limit function
CREATE OR REPLACE FUNCTION public.get_plan_daily_limit(p_plan public.user_plan)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_plan
    WHEN 'free' THEN 20
    WHEN 'creator' THEN 200
    WHEN 'pro' THEN 1000
    ELSE 20
  END;
$$;