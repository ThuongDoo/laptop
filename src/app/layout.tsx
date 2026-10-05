import type { Metadata, Viewport } from "next";
import { getSettings, siteUrl } from "@/lib/settings";
import "./globals.css";

// Dùng font hệ thống (Segoe UI / Roboto / San Francisco – đều hỗ trợ tiếng Việt):
// không tải web font → PageSpeed mobile ổn định trên 90.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.homeTitle, template: `%s | ${s.shopName}` },
    description: s.homeDescription,
    applicationName: s.shopName,
    openGraph: { siteName: s.shopName, locale: "vi_VN", type: "website" },
    icons: { icon: "/favicon.ico" },
  };
}

export const viewport: Viewport = { themeColor: "#dc2626" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="antialiased">
      <body className="flex min-h-screen flex-col font-sans">{children}</body>
    </html>
  );
}
