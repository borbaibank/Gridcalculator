import { NextResponse } from "next/server";
import type { Candle, KlinesFetchResult } from "@/types/backtest";

const BINANCE_FUTURES = "https://fapi.binance.com/fapi/v1/klines";
const DEFAULT_SYMBOL = "BTCUSDT";
const DEFAULT_INTERVAL = "5m";
const DEFAULT_DAYS = 30;
const LIMIT = 1500;

type RawKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

function parseKline(row: RawKline): Candle {
  return {
    openTime: row[0],
    open: parseFloat(row[1]),
    high: parseFloat(row[2]),
    low: parseFloat(row[3]),
    close: parseFloat(row[4]),
    volume: parseFloat(row[5]),
  };
}

async function fetchKlinesBatch(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    startTime: String(startTime),
    endTime: String(endTime),
    limit: String(LIMIT),
  });

  const res = await fetch(`${BINANCE_FUTURES}?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status}`);
  }

  const data = (await res.json()) as RawKline[];
  return data.map(parseKline);
}

async function fetchAllKlines(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
): Promise<Candle[]> {
  const all: Candle[] = [];
  let cursor = startTime;

  while (cursor < endTime) {
    const batch = await fetchKlinesBatch(symbol, interval, cursor, endTime);
    if (batch.length === 0) break;

    all.push(...batch);
    const lastOpen = batch[batch.length - 1].openTime;
    cursor = lastOpen + 1;

    if (batch.length < LIMIT) break;
  }

  const seen = new Set<number>();
  return all.filter((c) => {
    if (seen.has(c.openTime)) return false;
    seen.add(c.openTime);
    return true;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? DEFAULT_SYMBOL).toUpperCase();
  const interval = searchParams.get("interval") ?? DEFAULT_INTERVAL;
  const days = Math.min(Math.max(parseInt(searchParams.get("days") ?? String(DEFAULT_DAYS), 10) || DEFAULT_DAYS, 1), 90);

  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  try {
    const candles = await fetchAllKlines(symbol, interval, startTime, endTime);

    if (candles.length === 0) {
      return NextResponse.json({ error: "No candle data returned" }, { status: 502 });
    }

    const payload: KlinesFetchResult = {
      symbol,
      interval,
      candles,
      fetchedAt: Date.now(),
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch klines";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
