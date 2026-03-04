-- Fix integer constraints for numeric macro values
alter table public.logs
    alter column calories type numeric,
    alter column protein type numeric,
    alter column carbs type numeric,
    alter column fats type numeric;
