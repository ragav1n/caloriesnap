-- Migration: Add meal-specific calorie goals to profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS breakfast_goal integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS lunch_goal integer DEFAULT 700,
ADD COLUMN IF NOT EXISTS dinner_goal integer DEFAULT 600,
ADD COLUMN IF NOT EXISTS snack_goal integer DEFAULT 200;
