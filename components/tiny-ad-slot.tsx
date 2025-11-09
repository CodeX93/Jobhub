"use client";

import { useEffect } from "react";

const TINY_ADS_SCRIPT_ID = "tinyads-sdk";
const TINY_ADS_SCRIPT_SRC = "https://cdn.tinyads.io/v1/tinyads.min.js";

function loadScript(slotId: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(TINY_ADS_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = TINY_ADS_SCRIPT_ID;
  script.src = TINY_ADS_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  script.setAttribute("data-ads-client", slotId);
  document.body.appendChild(script);
}

interface TinyAdSlotProps {
  slotId?: string;
  className?: string;
}

export default function TinyAdSlot({
  slotId = process.env.NEXT_PUBLIC_TINYADS_SLOT_ID,
  className,
}: TinyAdSlotProps) {
  useEffect(() => {
    if (!slotId) return;
    loadScript(slotId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tinyads:render"));
    }
  }, [slotId]);

  if (!slotId) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
        Configure NEXT_PUBLIC_TINYADS_SLOT_ID to serve ads.
      </div>
    );
  }

  return (
    <div
      className={className}
      data-tinyads-slot={slotId}
      style={{ minHeight: 200 }}
    />
  );
}

