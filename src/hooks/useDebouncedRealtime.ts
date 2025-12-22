import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeSubscriptionOptions<T> {
  table: string;
  schema?: string;
  debounceMs?: number;
  onUpdate: (payload: T[]) => void;
  enabled?: boolean;
}

/**
 * Hook for debounced and batched real-time subscriptions
 */
export function useDebouncedRealtime<T = unknown>(
  options: RealtimeSubscriptionOptions<T>
) {
  const {
    table,
    schema = "public",
    debounceMs = 300,
    onUpdate,
    enabled = true,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const processBatch = useCallback(() => {
    if (batchRef.current.length === 0) return;
    const batch = [...batchRef.current];
    batchRef.current = [];
    onUpdate(batch);
  }, [onUpdate]);

  const scheduleProcess = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(processBatch, debounceMs);
  }, [debounceMs, processBatch]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `${table}-debounced-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema, table },
        (payload) => {
          const data = (payload.new || payload.old) as T;
          batchRef.current.push(data);
          scheduleProcess();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, schema, enabled, scheduleProcess]);

  return { isConnected };
}
