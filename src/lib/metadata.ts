import type { Metadata } from "next";

export const SITE_TITLE = "GridCalc — Grid Trading Calculator";
export const SITE_DESCRIPTION =
  "Free crypto grid trading calculator. Simulate profit per grid, margin, liquidation, and buy/sell orders for arithmetic and geometric grids with long, short, and neutral strategies.";

export function buildRootMetadata(siteUrl: string): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_TITLE,
      template: "%s | GridCalc",
    },
    description: SITE_DESCRIPTION,
    keywords: [
      "grid calculator",
      "grid trading",
      "grid bot",
      "binance futures",
      "crypto calculator",
      "futures grid",
    ],
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
  };
}
