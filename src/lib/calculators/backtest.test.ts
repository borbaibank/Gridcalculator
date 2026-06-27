import { describe, expect, it } from "vitest";
import {
  candlePricePath,
  resolveBacktestStartPrice,
  runBacktest,
} from "@/lib/calculators/backtest";
import type { Candle } from "@/types/backtest";
import type { GridCalculatorInput } from "@/types/calculator";

function makeCandle(open: number, high: number, low: number, close: number, openTime = 0): Candle {
  return { openTime, open, high, low, close, volume: 1 };
}

function baseGrid(overrides: Partial<GridCalculatorInput> = {}): GridCalculatorInput {
  return {
    upperPrice: 110_000,
    lowerPrice: 90_000,
    currentPrice: 100_000,
    startBotPrice: 100_000,
    gridCount: 10,
    margin: 100,
    addedMargin: 0,
    feePercent: 0.05,
    leverage: 5,
    maintenanceMarginPercent: 0.4,
    direction: "neutral",
    gridType: "arithmetic",
    ...overrides,
  };
}

describe("candlePricePath", () => {
  it("uses low-before-high on bullish candles", () => {
    expect(candlePricePath(makeCandle(100, 110, 95, 105))).toEqual([100, 95, 110, 105]);
  });

  it("uses high-before-low on bearish candles", () => {
    expect(candlePricePath(makeCandle(105, 110, 95, 100))).toEqual([105, 110, 95, 100]);
  });
});

describe("resolveBacktestStartPrice", () => {
  const candles = [makeCandle(95_000, 96_000, 94_000, 95_500)];

  it("uses first candle open clamped to grid range", () => {
    expect(resolveBacktestStartPrice(candles, 90_000, 110_000)).toBe(95_000);
  });

  it("clamps candle open to grid range", () => {
    expect(resolveBacktestStartPrice(candles, 96_000, 110_000)).toBe(96_000);
  });
});

describe("runBacktest", () => {
  it("completes at least one cycle when price oscillates across one grid", () => {
    const grid = baseGrid({ gridCount: 5 });
    const spacing = (grid.upperPrice - grid.lowerPrice) / grid.gridCount;
    const level = grid.startBotPrice + spacing;

    const candles: Candle[] = [
      makeCandle(grid.startBotPrice, grid.startBotPrice, grid.startBotPrice, grid.startBotPrice, 0),
      makeCandle(level, level + 50, level - 50, level, 60_000),
      makeCandle(level, level + 50, level - 50, grid.startBotPrice, 120_000),
    ];

    const result = runBacktest({
      grid,
      candles,
      startPrice: grid.startBotPrice,
    });

    expect(result).not.toBeNull();
    expect(result!.totalCycles).toBeGreaterThanOrEqual(1);
  });

  it("computes total ROI from equity not just realized PnL", () => {
    const grid = baseGrid({ gridCount: 5 });
    const candles: Candle[] = [
      makeCandle(100_000, 100_000, 100_000, 100_000, 0),
      makeCandle(100_000, 101_000, 99_000, 100_500, 86_400_000),
    ];

    const result = runBacktest({ grid, candles, startPrice: 100_000 });
    expect(result).not.toBeNull();
    expect(result!.roiPercent).toBeCloseTo(
      (result!.totalPnl / (grid.margin + grid.addedMargin)) * 100,
      5,
    );
  });

  it("marks candles in range when high-low intersects grid", () => {
    const grid = baseGrid();
    const candles: Candle[] = [
      makeCandle(120_000, 125_000, 115_000, 122_000, 0),
      makeCandle(100_000, 101_000, 99_000, 100_000, 86_400_000),
    ];

    const result = runBacktest({ grid, candles, startPrice: 100_000 });
    expect(result!.timeInRangePercent).toBe(50);
  });
});
