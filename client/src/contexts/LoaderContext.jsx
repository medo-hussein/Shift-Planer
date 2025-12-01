// src/context/LoadingContext.jsx
import React, { createContext, useContext, useState, useMemo } from "react";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [counter, setCounter] = useState(0);

  const show = () => setCounter((c) => c + 1);
  const hide = () => setCounter((c) => Math.max(0, c - 1));
  const reset = () => setCounter(0);
  const loading = counter > 0;

  const value = useMemo(() => ({ show, hide, reset, loading }), [loading]);

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider");
  return ctx;
}
