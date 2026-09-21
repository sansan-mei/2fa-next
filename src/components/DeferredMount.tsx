"use client";

import { ReactNode, useEffect, useState } from "react";

/** Load on first use, then retain state and existing close/cleanup behavior. */
export default function DeferredMount({ active, children }: {
  active: boolean;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);
  return active || mounted ? children : null;
}
