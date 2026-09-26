"use client";

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

import { ApiError } from "@/lib/api";

type ApiState<T> = {
  data: T | null;
  error: ApiError | Error | null;
  loading: boolean;
  reload: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

/**
 * Load data on mount (and when `deps` change). Pass `enabled: false` to hold
 * off until something the call needs, such as an id, is available.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
  options: { enabled?: boolean } = {},
): ApiState<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(enabled);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcherRef.current());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, load, ...deps]);

  return { data, error, loading, reload: load, setData };
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
