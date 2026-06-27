"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "gridcalc:visit-recorded";

export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function recordVisit() {
      try {
        const shouldIncrement = !sessionStorage.getItem(SESSION_KEY);
        const response = await fetch("/api/visits", {
          method: shouldIncrement ? "POST" : "GET",
        });
        const data = (await response.json()) as { count: number | null; configured?: boolean };

        if (typeof data.count === "number") {
          setCount(data.count);
          if (shouldIncrement) {
            sessionStorage.setItem(SESSION_KEY, "1");
          }
        }
      } catch {
        // Counter is optional — fail silently
      }
    }

    recordVisit();
  }, []);

  if (count === null) return null;

  return (
    <span className="text-xs text-[var(--color-text-muted)]">
      {count.toLocaleString("en-US")} visits
    </span>
  );
}
