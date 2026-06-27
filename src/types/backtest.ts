import type { GridCalculatorInput } from "@/types/calculator";

export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestRunInput {
  grid: GridCalculatorInput;
  candles: Candle[];
  /** Price where the bot starts (first candle open if omitted). */
  startPrice: number;
}

export interface DailyBacktestStat {
  date: string;
  cycles: number;
  buys: number;
  sells: number;
  realizedPnl: number;
  candlesInRange: number;
  candlesTotal: number;
}

export interface BacktestResult {
  symbol: string;
  interval: string;
  periodStart: string;
  periodEnd: string;
  startPrice: number;
  totalCycles: number;
  totalBuys: number;
  totalSells: number;
  avgCyclesPerDay: number;
  medianCyclesPerDay: number;
  maxCyclesDay: DailyBacktestStat;
  minCyclesDay: DailyBacktestStat;
  totalRealizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  finalEquity: number;
  roiPercent: number;
  timeInRangePercent: number;
  daysInRange: number;
  daysTotal: number;
  dailyStats: DailyBacktestStat[];
  candleCount: number;
  priceMin: number;
  priceMax: number;
  /** Estimated cycles/day if bot ran 24h inside grid range at observed volatility. */
  projectedCyclesPerActiveDay: number;
}

export interface KlinesFetchResult {
  symbol: string;
  interval: string;
  candles: Candle[];
  fetchedAt: number;
}
