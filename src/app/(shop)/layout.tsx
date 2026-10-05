import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { FloatingContact } from "@/components/shop/FloatingContact";
import { getSettings } from "@/lib/settings";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer s={s} />
      <FloatingContact s={s} />
    </>
  );
}
