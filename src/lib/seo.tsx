import type { Metadata } from "next";
import type { Settings } from "./settings";
import { siteUrl } from "./settings";

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" để tránh đóng thẻ script (khuyến nghị của Next.js JSON-LD guide)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function pageMetadata(opts: {
  title: string;
  description?: string | null;
  path: string;
  canonical?: string | null;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const url = opts.canonical || siteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description || undefined,
      url,
      type: opts.type || "website",
      images: opts.image ? [{ url: absolute(opts.image) }] : undefined,
    },
  };
}

export const absolute = (u: string) => (u.startsWith("http") ? u : siteUrl(u));

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: siteUrl(it.path),
    })),
  };
}

export function localBusinessJsonLd(s: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    "@id": siteUrl("/#store"),
    name: s.shopName,
    url: siteUrl("/"),
    telephone: s.hotline,
    email: s.email,
    image: siteUrl("/logo.svg"),
    priceRange: "5.000.000₫ - 50.000.000₫",
    address: { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "VN" },
    openingHours: "Mo-Su 08:00-21:00",
    sameAs: [s.facebook, s.youtube, s.tiktok].filter(Boolean),
  };
}
