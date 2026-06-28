import type { Metadata } from "next";
import { GridCalculator } from "@/features/grid-calculator/GridCalculator";
import { SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Crypto Grid Bot Calculator — Binance Futures Grid Trading",
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
};

export default function HomePage() {
  return <GridCalculator />;
}
