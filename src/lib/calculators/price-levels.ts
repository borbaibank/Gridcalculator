import type { GridCalculatorInput } from "@/types/calculator";

export function buildPriceLevels(
  input: Pick<GridCalculatorInput, "upperPrice" | "lowerPrice" | "gridCount" | "gridType">,
): number[] {
  const { upperPrice, lowerPrice, gridCount, gridType } = input;
  const levels: number[] = [];

  if (gridType === "arithmetic") {
    const step = (upperPrice - lowerPrice) / gridCount;
    for (let i = 0; i <= gridCount; i++) {
      levels.push(lowerPrice + step * i);
    }
  } else {
    const ratio = Math.pow(upperPrice / lowerPrice, 1 / gridCount);
    for (let i = 0; i <= gridCount; i++) {
      levels.push(lowerPrice * Math.pow(ratio, i));
    }
  }

  return levels;
}
