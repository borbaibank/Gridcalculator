"use client";

import { useState } from "react";

const DONATE_ADDRESS = "0xC8292dcEe73aBc90Fe6D87EF01588aA33F9249EF";
const SHORT_ADDRESS = `${DONATE_ADDRESS.slice(0, 6)}…${DONATE_ADDRESS.slice(-4)}`;

export function DonateUsdt() {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(DONATE_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copyAddress}
      title={`Donate USDT on BSC — ${DONATE_ADDRESS}`}
      className="flex max-w-[200px] flex-col items-end gap-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-right transition-colors hover:border-[var(--color-primary)]/40 sm:max-w-none"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Donate USDT · BSC
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-text)]">
        <span className="hidden lg:inline">{DONATE_ADDRESS}</span>
        <span className="lg:hidden">{SHORT_ADDRESS}</span>
        <span className="font-sans text-[10px] font-semibold uppercase text-[var(--color-primary)]">
          {copied ? "Copied!" : "Copy"}
        </span>
      </span>
    </button>
  );
}
