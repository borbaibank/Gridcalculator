import { runBacktest } from "../src/lib/calculators/backtest";
import type { Candle } from "../src/types/backtest";
import type { GridCalculatorInput } from "../src/types/calculator";

async function fetchAll(): Promise<Candle[]> {
  const end = Date.now();
  const start = end - 30 * 24 * 60 * 60 * 1000;
  const all: Candle[] = [];
  let cursor = start;
  while (cursor < end) {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&startTime=${cursor}&endTime=${end}&limit=1500`,
    );
    const b = (await res.json()) as unknown[][];
    if (!b.length) break;
    all.push(
      ...b.map((r) => ({
        openTime: r[0] as number,
        open: +r[1],
        high: +r[2],
        low: +r[3],
        close: +r[4],
        volume: +r[5],
      })),
    );
    cursor = (b[b.length - 1][0] as number) + 1;
    if (b.length < 1500) break;
  }
  return all;
}

const candles = await fetchAll();
const current = candles[candles.length - 1].close;
const startPrice = candles[0].open;

const grid: GridCalculatorInput = {
  upperPrice: 120_000,
  lowerPrice: 40_000,
  currentPrice: current,
  startBotPrice: startPrice,
  gridCount: 200,
  margin: 200,
  addedMargin: 0,
  feePercent: 0.05,
  leverage: 5,
  maintenanceMarginPercent: 0.4,
  direction: "neutral",
  gridType: "arithmetic",
};

const result = runBacktest({ grid, candles, startPrice });
const yDay = "2026-06-27";
const yStat = result!.dailyStats.find((d) => d.date === yDay);
const spacing = (grid.upperPrice - grid.lowerPrice) / grid.gridCount;

const yCandles = candles.filter(
  (c) => new Date(c.openTime).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) === yDay,
);
const yLow = Math.min(...yCandles.map((c) => c.low));
const yHigh = Math.max(...yCandles.map((c) => c.high));

console.log("Grid spacing:", spacing.toFixed(0), "USD");
console.log("Yesterday BTC range:", yLow.toFixed(0), "-", yHigh.toFixed(0));
console.log("Yesterday cycles:", yStat?.cycles, "buys:", yStat?.buys, "sells:", yStat?.sells);
console.log("30-day total:", result!.totalCycles, "avg/day:", result!.avgCyclesPerDay.toFixed(1));

for (const gc of [20, 50, 100, 200]) {
  const g = { ...grid, gridCount: gc };
  const r = runBacktest({ grid: g, candles, startPrice });
  const y = r!.dailyStats.find((d) => d.date === yDay);
  console.log(`gc=${gc} spacing=${((120000 - 40000) / gc).toFixed(0)} yesterday:`, y?.cycles);
}
