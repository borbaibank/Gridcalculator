import type { Metadata } from "next";

export const SITE_TITLE = "GridCalc — Free Crypto Grid Bot Calculator";
export const SITE_DESCRIPTION =
  "Free crypto grid bot calculator for Binance Futures. Estimate profit per grid, liquidation price, margin, and buy/sell orders before you trade. Arithmetic and geometric grids with long, short, and neutral strategies.";

export const SITE_KEYWORDS = [
  "grid bot calculator",
  "grid trading calculator",
  "crypto grid calculator",
  "binance futures grid",
  "binance grid bot calculator",
  "futures grid calculator",
  "grid bot profit calculator",
  "geometric grid calculator",
  "arithmetic grid calculator",
  "grid trading bot",
  "liquidation calculator",
  "crypto calculator",
];

export function buildRootMetadata(siteUrl: string): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_TITLE,
      template: "%s | GridCalc",
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    openGraph: {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: siteUrl,
      siteName: "GridCalc",
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}
