import type { Prisma } from "@prisma/client";
import { parseFilters, type SearchParams } from "@/lib/catalog";
import { Breadcrumbs } from "./Breadcrumbs";
import { Listing } from "./Listing";

type Props = {
  path: string;
  title: string;
  intro?: string | null;
  content?: string | null;
  searchParams: SearchParams;
  base?: Prisma.ProductWhereInput;
  hide?: ("brand" | "need")[];
  noBreadcrumb?: boolean;
};

export function CatalogPage({ path, title, intro, content, searchParams, base, hide }: Props) {
  const f = parseFilters(searchParams);
  return (
    <>
      <Breadcrumbs items={[{ name: title, path }]} />
      <div className="container-x">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {intro && <p className="mt-1 text-sm text-gray-600">{intro}</p>}
        </header>
        <Listing path={path} filters={f} searchParams={searchParams} base={base} hide={hide} />
        {content && f.page === 1 && <section className="card prose-content mt-8 p-6" dangerouslySetInnerHTML={{ __html: content }} />}
      </div>
    </>
  );
}
