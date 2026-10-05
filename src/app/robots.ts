import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/settings";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/gio-hang", "/thanh-toan", "/dat-hang/", "/tai-khoan", "/tim-kiem"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
