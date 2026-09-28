"use client";

import { useEffect, useState } from "react";

const MESSAGE_DURATION_MS = 2500;

export function useTransientMessage() {
  const [message, setMessage] = useState<{ text: string } | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), MESSAGE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  function showMessage(text: string) {
    setMessage({ text });
  }

  return { message: message?.text ?? null, showMessage };
}
