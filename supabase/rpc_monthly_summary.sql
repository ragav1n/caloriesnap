-- Function: get_monthly_calorie_summary
-- Purpose: Returns a list of days + total calories for a specific user and date range.

create or replace function get_monthly_calorie_summary(
  start_date timestamp, 
  end_date timestamp
)
returns table (
  date_log date,         -- The day (e.g., 2024-01-01)
  total_calories bigint, -- Sum of calories for that day
  log_count bigint       -- How many items you ate (optional, good for stats)
) 
language plpgsql
security definer -- Runs with high privileges to access data, but we filter by auth.uid() below
as $$
begin
  return query
  select 
    date(created_at) as date_log,        -- Strip the time, keep only YYYY-MM-DD
    sum(calories)::bigint as total_calories, 
    count(*)::bigint as log_count
  from logs
  where 
    -- SECURITY CRITICAL: This ensures you ONLY see your own data
    user_id = auth.uid() 
    
    -- Filter by the requested month
    and created_at >= start_date
    and created_at <= end_date
  group by date(created_at)              -- Group all meals into single days
  order by date(created_at);             -- Sort safely
end;
$$;
