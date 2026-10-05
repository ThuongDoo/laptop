import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";

const PER_PAGE = 12;

export const metadata = pageMetadata({
  title: "Tin tức & Kinh nghiệm chọn mua laptop cũ",
  description: "Đánh giá laptop, kinh nghiệm chọn mua laptop cũ, hướng dẫn kỹ thuật, mẹo sử dụng laptop bền bỉ.",
  path: "/tin-tuc",
});

export default async function NewsPage({ searchParams }: PageProps<"/tin-tuc">) {
  const page = Math.max(1, Number((await searchParams).trang) || 1);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.post.count({ where: { published: true } }),
  ]);
  const pages = Math.ceil(total / PER_PAGE);
  const [first, ...rest] = posts;

  return (
    <>
      <Breadcrumbs items={[{ name: "Tin tức", path: "/tin-tuc" }]} />
      <div className="container-x">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Tin tức & Kinh nghiệm chọn laptop</h1>
        {first && (
          <article className="card mb-6 grid overflow-hidden md:grid-cols-2">
            <Link href={`/tin-tuc/${first.slug}`} className="relative block aspect-[16/9] bg-gray-100">
              {first.cover && <Image src={first.cover} alt={first.title} fill loading="eager" fetchPriority="high" sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />}
            </Link>
            <div className="flex flex-col justify-center p-6">
              <time className="text-xs text-gray-500">{formatDate(first.createdAt)}</time>
              <h2 className="mt-1 text-xl font-bold">
                <Link href={`/tin-tuc/${first.slug}`} className="hover:text-brand-600">
                  {first.title}
                </Link>
              </h2>
              <p className="mt-2 text-gray-600">{first.excerpt}</p>
            </div>
          </article>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <article key={p.id} className="card overflow-hidden">
              <Link href={`/tin-tuc/${p.slug}`} className="relative block aspect-[16/9] bg-gray-100">
                {p.cover && <Image src={p.cover} alt={p.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />}
              </Link>
              <div className="p-4">
                <time className="text-xs text-gray-500">{formatDate(p.createdAt)}</time>
                <h2 className="mt-1 line-clamp-2 font-semibold">
                  <Link href={`/tin-tuc/${p.slug}`} className="hover:text-brand-600">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
        {pages > 1 && (
          <nav className="mt-6 flex justify-center gap-2" aria-label="Phân trang">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={n === 1 ? "/tin-tuc" : `/tin-tuc?trang=${n}`}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${n === page ? "bg-brand-600 text-white" : "bg-white ring-1 ring-gray-200"}`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
