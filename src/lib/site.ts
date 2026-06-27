/** Canonical site URL for SEO, sitemap, and OpenGraph. */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}
