"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { runBacktestInWorker } from "@/lib/backtest-client";
import { formatNumber, formatPercent, formatUsd } from "@/lib/utils/format";
import type { BacktestResult, Candle, KlinesFetchResult } from "@/types/backtest";
import type { GridCalculatorInput } from "@/types/calculator";

interface BacktestPanelProps {
  grid: GridCalculatorInput;
}

function errorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") return "";
  if (error instanceof Error && error.name === "AbortError") return "";
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Backtest failed";
}

function buildGridKey(grid: GridCalculatorInput): string {
  return [
    grid.lowerPrice,
    grid.upperPrice,
    grid.startBotPrice,
    grid.gridCount,
    grid.margin,
    grid.addedMargin,
    grid.feePercent,
    grid.leverage,
    grid.direction,
    grid.gridType,
  ].join("|");
}

function DailyCycleChart({ dailyStats }: { dailyStats: BacktestResult["dailyStats"] }) {
  const max = Math.max(...dailyStats.map((d) => d.cycles), 1);
  const recent = dailyStats.slice(-14);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Cycles — 14 วันล่าสุด</h3>
        <span className="text-[10px] text-[var(--color-text-muted)]">สูงสุด {max} / วัน</span>
      </div>
      <div className="flex h-24 items-end gap-1 sm:gap-1.5">
        {recent.map((day) => {
          const barPx = max > 0 ? Math.round((day.cycles / max) * 72) : 0;
          const height = day.cycles > 0 ? Math.max(barPx, 6) : 2;
          return (
            <div
              key={day.date}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${day.date}: ${day.cycles} cycles`}
            >
              <div
                className="w-full rounded-t-md bg-[var(--color-primary)]/80 transition-all group-hover:bg-[var(--color-primary)]"
                style={{ height: `${height}px` }}
              />
              <span className="hidden text-[9px] text-[var(--color-text-muted)] sm:block">
                {day.date.slice(8)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BacktestPanel({ grid }: BacktestPanelProps) {
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [resultGridKey, setResultGridKey] = useState("");

  const candlesRef = useRef<Candle[] | null>(null);
  const intervalRef = useRef("5m");
  const gridRef = useRef(grid);
  const abortRef = useRef<AbortController | null>(null);
  const computeRunRef = useRef(0);

  gridRef.current = grid;
  const gridKey = buildGridKey(grid);

  const runCompute = useCallback((candles: Candle[], interval: string, forGridKey: string) => {
    const runId = ++computeRunRef.current;
    setComputing(true);
    setError(null);

    const currentGrid = gridRef.current;
    if (!currentGrid) {
      setComputing(false);
      return;
    }

    void runBacktestInWorker(currentGrid, candles)
      .then((backtest) => {
        if (runId !== computeRunRef.current) return;
        setResult({ ...backtest, interval });
        setResultGridKey(forGridKey);
      })
      .catch((err: unknown) => {
        if (runId !== computeRunRef.current) return;
        setResult(null);
        setResultGridKey("");
        const message = errorMessage(err);
        if (message) setError(message);
      })
      .finally(() => {
        if (runId === computeRunRef.current) setComputing(false);
      });
  }, []);

  const fetchCandles = useCallback(
    async (recomputeKey?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/backtest/klines?symbol=BTCUSDT&interval=5m&days=30", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }

        const data = (await res.json()) as KlinesFetchResult;
        if (controller.signal.aborted) return;

        candlesRef.current = data.candles;
        intervalRef.current = data.interval;
        runCompute(data.candles, data.interval, recomputeKey ?? buildGridKey(gridRef.current!));
      } catch (err) {
        if (controller.signal.aborted) return;
        setResult(null);
        setResultGridKey("");
        const message = errorMessage(err);
        if (message) setError(message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [runCompute],
  );

  const recompute = useCallback(() => {
    if (!candlesRef.current) {
      void fetchCandles(gridKey);
      return;
    }
    runCompute(candlesRef.current, intervalRef.current, gridKey);
  }, [fetchCandles, gridKey, runCompute]);

  useEffect(() => {
    if (!candlesRef.current) {
      void fetchCandles(gridKey);
      return;
    }

    const timer = window.setTimeout(recompute, 250);
    return () => window.clearTimeout(timer);
  }, [gridKey, fetchCandles, recompute]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      computeRunRef.current += 1;
    };
  }, []);

  const isBusy = loading || computing;
  const isStale = Boolean(result && resultGridKey && resultGridKey !== gridKey);
  const lowRangeWarning = result && result.timeInRangePercent < 25;

  const gridSpacing = (grid.upperPrice - grid.lowerPrice) / grid.gridCount;

  return (
    <SectionCard
      title="Backtest — BTC 1 เดือน"
      subtitle={`Binance Futures BTCUSDT · 5m · close-to-close · spacing ~${formatNumber(gridSpacing, 0)} USD`}
      noPadding
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={recompute}
            disabled={isBusy}
            className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[#080a0d] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {computing ? "กำลังคำนวณ…" : "คำนวณใหม่"}
          </button>
          <button
            type="button"
            onClick={() => void fetchCandles(gridKey)}
            disabled={isBusy}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "กำลังโหลด…" : "โหลด BTC ใหม่"}
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isBusy ? "animate-pulse bg-[var(--color-primary)]" : "bg-[var(--color-success)]"
              }`}
            />
            {isBusy ? "กำลังอัปเดต…" : "เปลี่ยน grid แล้วคำนวณอัตโนมัติ"}
          </span>
        </div>

        {isStale && !isBusy && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            ผลลัพธ์ยังเป็นของ grid เก่า — กด &quot;คำนวณใหม่&quot; หรือรอสักครู่
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-dim)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {loading && !result && (
          <div className="space-y-4">
            <div className="card-highlight animate-pulse">
              <div className="h-4 w-32 rounded bg-white/10" />
              <div className="mt-4 h-12 w-24 rounded bg-white/10" />
            </div>
            <p className="text-center text-sm text-[var(--color-text-muted)]">
              กำลังดึงข้อมูล BTCUSDT 30 วันจาก Binance…
            </p>
          </div>
        )}

        {result && (
          <div className={isBusy ? "pointer-events-none opacity-60 transition-opacity" : ""}>
            {lowRangeWarning && (
              <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
                <p className="font-semibold text-amber-300">ราคา BTC อยู่นอก grid เป็นส่วนใหญ่</p>
                <p className="mt-1 text-[var(--color-text-muted)]">
                  อยู่ใน range แค่ {formatPercent(result.timeInRangePercent)} — ปรับ Lower/Upper ให้ครอบคลุม $
                  {formatNumber(result.priceMin, 0)}–${formatNumber(result.priceMax, 0)} (ช่วง 30 วัน)
                </p>
              </div>
            )}

            <div className="card-highlight">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="label mb-1">Cycles / วัน (เฉลี่ย 30 วัน)</p>
                  <p className="text-4xl font-bold gradient-text sm:text-5xl">
                    {formatNumber(result.avgCyclesPerDay, 1)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    มัธยฐาน {formatNumber(result.medianCyclesPerDay, 1)} · วันที่ราคาอยู่ใน range{" "}
                    <span className="font-semibold text-[var(--color-primary)]">
                      {formatNumber(result.projectedCyclesPerActiveDay, 1)}
                    </span>{" "}
                    cycles/วัน
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 px-4 py-3 text-right">
                  <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                    รวม 30 วัน
                  </p>
                  <p className="text-3xl font-bold text-[var(--color-text)]">
                    {result.totalCycles.toLocaleString()}
                    <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">cycles</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <DailyCycleChart dailyStats={result.dailyStats} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                compact
                label="Realized PnL"
                value={formatUsd(result.totalRealizedPnl)}
                variant={result.totalRealizedPnl >= 0 ? "success" : "danger"}
              />
              <StatCard
                compact
                label="Unrealized PnL"
                value={formatUsd(result.unrealizedPnl)}
                variant={result.unrealizedPnl >= 0 ? "success" : "danger"}
              />
              <StatCard
                compact
                label="Total PnL"
                value={formatUsd(result.totalPnl)}
                variant={result.totalPnl >= 0 ? "success" : "danger"}
              />
              <StatCard compact label="ROI (total)" value={formatPercent(result.roiPercent)} />
              <StatCard
                compact
                label="Time in Range"
                value={formatPercent(result.timeInRangePercent)}
                variant={result.timeInRangePercent >= 50 ? "success" : "danger"}
              />
              <StatCard
                compact
                label="Best Day"
                value={`${result.maxCyclesDay.cycles}`}
                variant="primary"
              />
              <StatCard compact label="Buys" value={String(result.totalBuys)} />
              <StatCard compact label="Sells" value={String(result.totalSells)} />
              <StatCard
                compact
                label="BTC 30d"
                value={`$${formatNumber(result.priceMin, 0)}–${formatNumber(result.priceMax, 0)}`}
              />
              <StatCard compact label="Start" value={`$${formatNumber(result.startPrice)}`} />
              <StatCard compact label="Equity" value={formatUsd(result.finalEquity)} variant="primary" />
            </div>

            <div className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/30 p-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
              <p>
                <span className="font-semibold text-[var(--color-text)]">{result.periodStart}</span>
                {" → "}
                <span className="font-semibold text-[var(--color-text)]">{result.periodEnd}</span>
                {" · "}
                {result.candleCount.toLocaleString()} candles ({result.interval})
                {" · "}
                {result.daysInRange}/{result.daysTotal} วันใน range
              </p>
              <p className="mt-1.5">
                Grid ${formatNumber(grid.lowerPrice, 0)}–${formatNumber(grid.upperPrice, 0)} ·{" "}
                {grid.gridCount} grids · {grid.direction} · fee {grid.feePercent}%
              </p>
            </div>

            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">รายวัน</h3>
              <div className="max-h-[280px] overflow-x-auto overflow-y-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full min-w-[480px] text-xs sm:text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="table-head">
                      <th className="px-4 py-2.5 text-left">วันที่</th>
                      <th className="px-4 py-2.5 text-right">Cycles</th>
                      <th className="hidden px-4 py-2.5 text-right sm:table-cell">Buy</th>
                      <th className="hidden px-4 py-2.5 text-right sm:table-cell">Sell</th>
                      <th className="px-4 py-2.5 text-right">PnL</th>
                      <th className="hidden px-4 py-2.5 text-right md:table-cell">In Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...result.dailyStats].reverse().map((day) => (
                      <tr key={day.date} className="table-row">
                        <td className="px-4 py-2.5 font-mono text-[var(--color-text-muted)]">
                          {day.date}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                            day.cycles > 0
                              ? "text-[var(--color-primary)]"
                              : "text-[var(--color-text-muted)]"
                          }`}
                        >
                          {day.cycles}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">
                          {day.buys}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">
                          {day.sells}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right tabular-nums ${
                            day.realizedPnl >= 0
                              ? "text-[var(--color-success)]"
                              : "text-[var(--color-danger)]"
                          }`}
                        >
                          {formatUsd(day.realizedPnl)}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right text-[var(--color-text-muted)] md:table-cell">
                          {day.candlesInRange}/{day.candlesTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
