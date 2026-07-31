import { supabase } from "../supabase/client";

export interface WebsiteSetting {
  id: string;
  section: string;
  field_key: string;
  field_value: string;
  field_type: string;
  updated_at: string;
}

export interface WebsiteSettingPayload {
  section: string;
  field_key: string;
  field_value: string;
  field_type: string;
}

export async function fetchAllWebsiteSettings(): Promise<WebsiteSetting[]> {
  const { data, error } = await supabase
    .from("website_settings")
    .select("*")
    .order("section", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WebsiteSetting[];
}

export async function fetchSectionSettings(section: string): Promise<WebsiteSetting[]> {
  const { data, error } = await supabase
    .from("website_settings")
    .select("*")
    .eq("section", section);

  if (error) throw error;
  return (data ?? []) as WebsiteSetting[];
}

export async function upsertSetting(
  section: string,
  fieldKey: string,
  fieldValue: string,
  fieldType: string = "text",
): Promise<WebsiteSetting> {
  const { data, error } = await supabase
    .from("website_settings")
    .upsert(
      { section, field_key: fieldKey, field_value: fieldValue, field_type: fieldType, updated_at: new Date().toISOString() },
      { onConflict: "section,field_key" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as WebsiteSetting;
}

export async function deleteSetting(id: string): Promise<void> {
  const { error } = await supabase.from("website_settings").delete().eq("id", id);
  if (error) throw error;
}