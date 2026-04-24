"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createClient } from "@/services/supabase/server";

export type SaveSiteLayoutState =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function saveSiteLayout(
  _prev: SaveSiteLayoutState | null,
  formData: FormData
): Promise<SaveSiteLayoutState> {
  await requireAdmin();
  const banner_1_url = String(formData.get("banner_1_url") ?? "").trim();
  const banner_2_url = String(formData.get("banner_2_url") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.from("site_layout").upsert(
    {
      id: "default",
      banner_1_url,
      banner_2_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/layout");

  return { ok: true, message: "Layout do site salvo." };
}
