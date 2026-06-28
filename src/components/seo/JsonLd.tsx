import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/metadata";

interface JsonLdProps {
  siteUrl: string;
}

export function JsonLd({ siteUrl }: JsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_TITLE,
    alternateName: "GridCalc",
    url: siteUrl,
    description: SITE_DESCRIPTION,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Grid bot profit per grid calculator",
      "Binance Futures margin and liquidation estimate",
      "Arithmetic and geometric grid spacing",
      "Long, short, and neutral grid strategies",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
