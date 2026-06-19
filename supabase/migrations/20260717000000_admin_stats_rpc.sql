-- RPC to fetch consolidated admin statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'dailyIncome', (SELECT COALESCE(SUM(amount), 0) FROM public.income_entries WHERE created_at >= CURRENT_DATE),
    'dailySales', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE created_at >= CURRENT_DATE AND (status = 'paid' OR status = 'completed')),
    'dailyExpenses', (SELECT COALESCE(SUM(amount), 0) FROM public.expense_entries WHERE created_at >= CURRENT_DATE),
    'dailyLoans', (SELECT COALESCE(SUM(amount), 0) FROM public.loan_applications WHERE created_at >= CURRENT_DATE AND status = 'approved'),
    'totalSales', (SELECT COALESCE(SUM(total), 0) FROM public.orders WHERE (status = 'paid' OR status = 'completed')),
    'totalIncome', (SELECT COALESCE(SUM(amount), 0) FROM public.income_entries),
    'activeRisk', (SELECT COALESCE(SUM(balance), 0) FROM public.loan_applications WHERE status IN ('approved', 'repaying')),
    'totalUsers', (SELECT COUNT(*) FROM public.profiles),
    'approvedCount', (SELECT COUNT(*) FROM public.loan_applications WHERE status = 'approved'),
    'totalApplications', (SELECT COUNT(*) FROM public.loan_applications)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users (with admin check handled in app)
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
