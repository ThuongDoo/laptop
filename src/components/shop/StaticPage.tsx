import type { Page } from "@prisma/client";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs } from "./Breadcrumbs";

export async function StaticPage({ page }: { page: Page }) {
  const isContact = page.slug === "lien-he";
  const s = await getSettings();
  return (
    <>
      <Breadcrumbs items={[{ name: page.title, path: `/${page.slug}` }]} />
      <div className="container-x">
        <article className="card mx-auto max-w-4xl p-6 md:p-10">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{page.title}</h1>
          <div className="prose-content mt-4" dangerouslySetInnerHTML={{ __html: page.content }} />
          {isContact && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2">
                  <MapPin className="shrink-0 text-brand-600" size={18} /> {s.address}
                </li>
                <li className="flex gap-2">
                  <Phone className="shrink-0 text-brand-600" size={18} />
                  <a href={`tel:${s.hotline.replace(/\s/g, "")}`} className="font-semibold text-brand-600">
                    {s.hotline}
                  </a>
                </li>
                <li className="flex gap-2">
                  <Mail className="shrink-0 text-brand-600" size={18} /> {s.email}
                </li>
                <li className="flex gap-2">
                  <Clock className="shrink-0 text-brand-600" size={18} /> {s.openingHours}
                </li>
                <li className="flex flex-wrap gap-2 pt-2">
                  <a href={`https://zalo.me/${s.zalo}`} target="_blank" rel="noopener nofollow" className="btn bg-[#0068ff] text-white">
                    Chat Zalo
                  </a>
                  <a href={`https://m.me/${s.messenger}`} target="_blank" rel="noopener nofollow" className="btn bg-blue-600 text-white">
                    Chat Messenger
                  </a>
                </li>
              </ul>
              <iframe title="Bản đồ cửa hàng" src={s.mapEmbed} loading="lazy" className="h-72 w-full rounded-lg border-0" />
            </div>
          )}
        </article>
      </div>
    </>
  );
}
