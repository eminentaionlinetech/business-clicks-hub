import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = Record<string, unknown> & { id: string };

/**
 * Small CRUD helper for the per-user tool tables. RLS keeps every read and
 * write scoped to the signed-in user.
 */
export function useRows<T extends Row>(table: string, orderBy = "created_at", ascending = false) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from(table as never)
      .select("*")
      .order(orderBy, { ascending });
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as T[]);
    setLoading(false);
  }, [table, orderBy, ascending]);

  useEffect(() => {
    void load();
  }, [load]);

  const insert = useCallback(
    async (values: Record<string, unknown>) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { error } = await supabase
        .from(table as never)
        .insert({ ...values, user_id: auth.user.id } as never);
      if (error) {
        toast.error(error.message);
        return false;
      }
      await load();
      return true;
    },
    [table, load],
  );

  const update = useCallback(
    async (id: string, values: Record<string, unknown>) => {
      const { error } = await supabase
        .from(table as never)
        .update(values as never)
        .eq("id", id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      await load();
      return true;
    },
    [table, load],
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from(table as never).delete().eq("id", id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      await load();
      return true;
    },
    [table, load],
  );

  return { rows, loading, reload: load, insert, update, remove };
}
