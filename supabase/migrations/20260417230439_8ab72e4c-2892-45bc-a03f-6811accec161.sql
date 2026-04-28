-- Cleanup function: delete pending orders older than 30 minutes that never reached Stripe checkout completion.
CREATE OR REPLACE FUNCTION public.cleanup_stale_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH stale AS (
    SELECT id FROM public.orders
    WHERE status = 'pending'
      AND created_at < now() - interval '30 minutes'
  ),
  del_items AS (
    DELETE FROM public.order_items
    WHERE order_id IN (SELECT id FROM stale)
    RETURNING 1
  ),
  del_orders AS (
    DELETE FROM public.orders
    WHERE id IN (SELECT id FROM stale)
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM del_orders;
  RETURN deleted_count;
END;
$$;

-- Schedule the cleanup hourly. Idempotent: unschedule if already present.
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-stale-pending-orders');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-stale-pending-orders',
  '15 * * * *',
  $$ SELECT public.cleanup_stale_pending_orders(); $$
);