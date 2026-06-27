import type { Metadata } from "next";
import { GridCalculator } from "@/features/grid-calculator/GridCalculator";

export const metadata: Metadata = {
  title: "Grid Trading Calculator",
  description:
    "Free crypto grid trading calculator for Binance Futures. Plan arithmetic and geometric grids with long, short, and neutral strategies before you trade.",
};

export default function HomePage() {
  return <GridCalculator />;
}
