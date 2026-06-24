-- Pin search_path on the trigger function (security advisor 0011:
-- function_search_path_mutable). The function only calls now(), but an
-- explicit empty search_path satisfies the linter and is best practice.
alter function public.set_updated_at() set search_path = '';
