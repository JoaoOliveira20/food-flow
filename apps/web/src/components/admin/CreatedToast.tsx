"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "./shell/Toaster";

type CreatedToastProps = {
  title: string;
  detail: string;
};

export function CreatedToast({ title, detail }: CreatedToastProps) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;
    hasShown.current = true;
    toast({ tone: "success", title, detail });
    router.replace(pathname, { scroll: false });
  }, [toast, router, pathname, title, detail]);

  return null;
}
