"use client";

import { useEffect, useState } from "react";

export function useClock(includeSeconds = false) {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hh = String(ist.getHours()).padStart(2, "0");
      const mm = String(ist.getMinutes()).padStart(2, "0");
      const ss = String(ist.getSeconds()).padStart(2, "0");
      setTime(includeSeconds ? `${hh}:${mm}:${ss} IST` : `${hh}:${mm} IST`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [includeSeconds]);

  return time;
}
