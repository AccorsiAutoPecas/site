import { createClient } from "@/services/supabase/server";
import type { SiteLayoutRow } from "@/types/siteLayout";

const EMPTY: SiteLayoutRow = {
  id: "default",
  banner_1_url: "",
  banner_2_url: "",
  updated_at: new Date(0).toISOString(),
};

export async function getSiteLayout(): Promise<SiteLayoutRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_layout")
    .select("id, banner_1_url, banner_2_url, updated_at")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) {
    return EMPTY;
  }

  return data as SiteLayoutRow;
}
