-- Add daily_generation_limit column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN daily_generation_limit integer NOT NULL DEFAULT 20;