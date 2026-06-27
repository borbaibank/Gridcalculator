import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const VISIT_KEY = "gridcalc:visits";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ count: null, configured: false });
  }

  const count = (await redis.get<number>(VISIT_KEY)) ?? 0;
  return NextResponse.json({ count, configured: true });
}

export async function POST() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ count: null, configured: false });
  }

  const count = await redis.incr(VISIT_KEY);
  return NextResponse.json({ count, configured: true });
}
