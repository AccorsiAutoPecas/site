import { SiteFooter } from "@/components/layout/SiteFooter";
import { CartPage } from "@/features/carrinho/components/CartPage";
import { createClient } from "@/services/supabase/server";

export default async function CarrinhoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfileCep = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("cep")
      .eq("id", user.id)
      .maybeSingle();
    initialProfileCep = typeof profile?.cep === "string" ? profile.cep : "";
  }

  return (
    <div className="flex min-h-dvh flex-col bg-store-cream font-sans text-store-navy">
      <main className="flex flex-1 flex-col">
        <CartPage initialProfileCep={initialProfileCep} />
      </main>
      <SiteFooter />
    </div>
  );
}
