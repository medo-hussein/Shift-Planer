import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [counter, setCounter] = useState(0);

  const show = useCallback(() => setCounter((c) => c + 1), []);
  const hide = useCallback(() => setCounter((c) => Math.max(0, c - 1)), []);
  const reset = useCallback(() => setCounter(0), []);
  
  const loading = counter > 0;

  const value = useMemo(() => ({
    show,
    hide,
    reset,
    loading
  }), [show, hide, reset, loading]);

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}