import { runBacktest } from "@/lib/calculators/backtest";
import type { BacktestRunInput } from "@/types/backtest";

export type BacktestWorkerRequest = BacktestRunInput & { id: number };

export type BacktestWorkerResponse =
  | { id: number; ok: true; result: NonNullable<ReturnType<typeof runBacktest>> }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<BacktestWorkerRequest>) => {
  const { id, grid, candles, startPrice } = event.data;
  try {
    const result = runBacktest({
      grid: { ...grid, startBotPrice: startPrice },
      candles,
      startPrice,
    });

    if (!result) {
      const response: BacktestWorkerResponse = {
        id,
        ok: false,
        error: "Backtest failed — check grid range and settings",
      };
      self.postMessage(response);
      return;
    }

    const response: BacktestWorkerResponse = { id, ok: true, result };
    self.postMessage(response);
  } catch (err) {
    const response: BacktestWorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : "Backtest failed",
    };
    self.postMessage(response);
  }
};
