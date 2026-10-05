import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: "Trang chủ", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav aria-label="Breadcrumb" className="container-x py-3 text-sm text-gray-500">
        <ol className="no-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap">
          {all.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} />}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-gray-800">
                  {it.name}
                </span>
              ) : (
                <Link href={it.path} className="hover:text-brand-600">
                  {it.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
