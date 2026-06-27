import { buildGridCells } from "@/lib/calculators/grid-cells";
import {
  createWalletAtStart,
  walkPriceSegment,
  walletEquity,
  walletUnrealizedPnl,
} from "@/lib/calculators/grid-engine";
import type { BacktestResult, BacktestRunInput, Candle, DailyBacktestStat } from "@/types/backtest";
import { totalWallet } from "@/types/calculator";

/** Intrabar path: bullish bar visits low before high; bearish bar visits high before low. */
export function candlePricePath(candle: Candle): number[] {
  const { open, high, low, close } = candle;
  if (open <= close) {
    return [open, low, high, close];
  }
  return [open, high, low, close];
}

function candleIntersectsRange(
  candle: Candle,
  lower: number,
  upper: number,
): boolean {
  return candle.high >= lower && candle.low <= upper;
}

function localDateKey(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function resolveBacktestStartPrice(
  candles: Candle[],
  lower: number,
  upper: number,
): number | null {
  if (candles.length === 0) return null;
  const open = candles[0].open;
  return Math.min(Math.max(open, lower), upper);
}

export function runBacktest(input: BacktestRunInput): BacktestResult | null {
  const gridInput = { ...input.grid, startBotPrice: input.startPrice };
  const cells = buildGridCells(gridInput);
  if (!cells || input.candles.length === 0) return null;

  const { grid, candles, startPrice } = input;
  const walletBalance = totalWallet(grid);
  const wallet = createWalletAtStart(gridInput, cells);

  const dailyStats: DailyBacktestStat[] = [];
  let currentDate = "";
  let dayCycles = 0;
  let dayBuys = 0;
  let daySells = 0;
  let dayPnlStart = 0;
  let dayInRange = 0;
  let dayTotal = 0;
  let candlesInRange = 0;
  let totalCycles = 0;
  let totalBuys = 0;
  let totalSells = 0;
  let lastPrice = startPrice;

  const walkInput = {
    direction: grid.direction,
    feePercent: grid.feePercent,
    upperPrice: grid.upperPrice,
  };

  const flushDay = () => {
    if (!currentDate) return;
    dailyStats.push({
      date: currentDate,
      cycles: dayCycles,
      buys: dayBuys,
      sells: daySells,
      realizedPnl: wallet.realizedPnl - dayPnlStart,
      candlesInRange: dayInRange,
      candlesTotal: dayTotal,
    });
  };

  for (const candle of candles) {
    const dateKey = localDateKey(candle.openTime);
    if (dateKey !== currentDate) {
      flushDay();
      currentDate = dateKey;
      dayCycles = 0;
      dayBuys = 0;
      daySells = 0;
      dayPnlStart = wallet.realizedPnl;
      dayInRange = 0;
      dayTotal = 0;
    }

    dayTotal++;
    if (candleIntersectsRange(candle, grid.lowerPrice, grid.upperPrice)) {
      dayInRange++;
      candlesInRange++;
    }

    const delta = walkPriceSegment(wallet, cells, lastPrice, candle.close, walkInput);
    dayCycles += delta.cycles;
    dayBuys += delta.buys;
    daySells += delta.sells;
    totalCycles += delta.cycles;
    totalBuys += delta.buys;
    totalSells += delta.sells;

    lastPrice = candle.close;
  }
  flushDay();

  const cycleCounts = dailyStats.map((d) => d.cycles);
  const emptyDay: DailyBacktestStat = {
    date: "",
    cycles: 0,
    buys: 0,
    sells: 0,
    realizedPnl: 0,
    candlesInRange: 0,
    candlesTotal: 0,
  };

  const maxDay = dailyStats.reduce((best, d) => (d.cycles > best.cycles ? d : best), emptyDay);
  const minDay = dailyStats.reduce((best, d) => (d.cycles < best.cycles ? d : best), emptyDay);

  const lastClose = candles[candles.length - 1].close;
  const finalEquity = walletEquity(wallet, lastClose);
  const unrealizedPnl = walletUnrealizedPnl(wallet, lastClose, grid.direction);
  const totalPnl = finalEquity - walletBalance;
  const daysInRange = dailyStats.filter((d) => d.candlesInRange > 0).length;

  return {
    symbol: "BTCUSDT",
    interval: "5m",
    periodStart: localDateKey(candles[0].openTime),
    periodEnd: localDateKey(candles[candles.length - 1].openTime),
    startPrice,
    totalCycles,
    totalBuys,
    totalSells,
    avgCyclesPerDay: dailyStats.length > 0 ? totalCycles / dailyStats.length : 0,
    medianCyclesPerDay: median(cycleCounts),
    maxCyclesDay: maxDay,
    minCyclesDay: minDay,
    totalRealizedPnl: wallet.realizedPnl,
    unrealizedPnl,
    totalPnl,
    finalEquity,
    roiPercent: walletBalance > 0 ? (totalPnl / walletBalance) * 100 : 0,
    timeInRangePercent: candles.length > 0 ? (candlesInRange / candles.length) * 100 : 0,
    daysInRange,
    daysTotal: dailyStats.length,
    dailyStats,
    candleCount: candles.length,
    priceMin: Math.min(...candles.map((c) => c.low)),
    priceMax: Math.max(...candles.map((c) => c.high)),
    projectedCyclesPerActiveDay:
      daysInRange > 0
        ? dailyStats.filter((d) => d.candlesInRange > 0).reduce((s, d) => s + d.cycles, 0) /
          daysInRange
        : 0,
  };
}
