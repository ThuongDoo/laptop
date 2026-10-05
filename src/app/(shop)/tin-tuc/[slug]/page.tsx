import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { JsonLd, absolute, pageMetadata } from "@/lib/seo";
import { formatDate, stripHtml, truncate } from "@/lib/format";
import { getSettings, siteUrl } from "@/lib/settings";
import { cardSelect } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { ProductCard } from "@/components/shop/ProductCard";

const getPost = cache((slug: string) =>
  prisma.post.findFirst({ where: { slug, published: true }, include: { author: { select: { name: true } } } }),
);

export async function generateMetadata({ params }: PageProps<"/tin-tuc/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return pageMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || truncate(stripHtml(post.content), 160),
    path: `/tin-tuc/${post.slug}`,
    canonical: post.canonical,
    image: post.cover,
    type: "article",
  });
}

export default async function PostPage({ params }: PageProps<"/tin-tuc/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const [s, latest, hot] = await Promise.all([
    getSettings(),
    prisma.post.findMany({ where: { published: true, id: { not: post.id } }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.product.findMany({ where: { published: true, featured: true }, select: cardSelect, orderBy: { soldCount: "desc" }, take: 2 }),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          image: post.cover ? [absolute(post.cover)] : undefined,
          datePublished: post.createdAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          author: { "@type": "Person", name: post.author?.name || s.shopName },
          publisher: { "@type": "Organization", name: s.shopName, logo: { "@type": "ImageObject", url: siteUrl("/logo.svg") } },
          mainEntityOfPage: siteUrl(`/tin-tuc/${post.slug}`),
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Tin tức", path: "/tin-tuc" },
          { name: post.title, path: `/tin-tuc/${post.slug}` },
        ]}
      />
      <div className="container-x grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="card min-w-0 p-5 md:p-8">
          <h1 className="text-2xl leading-snug font-bold text-gray-900 md:text-3xl">{post.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {post.author?.name && <>{post.author.name} · </>}
            <time dateTime={post.createdAt.toISOString()}>{formatDate(post.createdAt)}</time>
          </p>
          {post.cover && (
            <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-lg">
              <Image src={post.cover} alt={post.title} fill loading="eager" fetchPriority="high" sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" />
            </div>
          )}
          <div className="prose-content mt-4" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-3 font-bold text-gray-900">Bài viết mới</h2>
            <ul className="space-y-3">
              {latest.map((p) => (
                <li key={p.id}>
                  <Link href={`/tin-tuc/${p.slug}`} className="text-sm font-medium hover:text-brand-600">
                    {p.title}
                  </Link>
                  <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">Laptop đang hot</h2>
            {hot.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
