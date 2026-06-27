import type { BacktestResult } from "@/types/backtest";
import type { GridCalculatorInput } from "@/types/calculator";
import type { Candle } from "@/types/backtest";
import type {
  BacktestWorkerRequest,
  BacktestWorkerResponse,
} from "@/workers/backtest.worker";
import { resolveBacktestStartPrice, runBacktest } from "@/lib/calculators/backtest";

let worker: Worker | null = null;
let jobId = 0;

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (!worker) {
    worker = new Worker(new URL("../workers/backtest.worker.ts", import.meta.url));
  }
  return worker;
}

export function runBacktestInWorker(
  grid: GridCalculatorInput,
  candles: Candle[],
): Promise<BacktestResult> {
  const startPrice = resolveBacktestStartPrice(candles, grid.lowerPrice, grid.upperPrice);

  if (startPrice === null) {
    return Promise.reject(new Error("Could not resolve start price from candle data"));
  }

  const useWorker = grid.gridCount > 50 && typeof window !== "undefined";
  const w = useWorker ? getWorker() : null;

  if (!w) {
    const result = runBacktest({
      grid: { ...grid, startBotPrice: startPrice },
      candles,
      startPrice,
    });
    if (!result) {
      return Promise.reject(new Error("Backtest failed — check grid range and settings"));
    }
    return Promise.resolve(result);
  }

  const id = ++jobId;

  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<BacktestWorkerResponse>) => {
      if (event.data.id !== id) return;
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      if (event.data.ok) resolve(event.data.result);
      else reject(new Error(event.data.error));
    };

    const onError = () => {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      reject(new Error("Backtest worker failed"));
    };

    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);

    const payload: BacktestWorkerRequest = {
      id,
      grid,
      candles,
      startPrice,
    };
    w.postMessage(payload);
  });
}

export function terminateBacktestWorker(): void {
  worker?.terminate();
  worker = null;
}
