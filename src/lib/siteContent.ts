import { supabase } from "../supabase/client";

export interface ContentField {
  id: string;
  section: string;
  field_key: string;
  field_value: string;
  field_type: string;
  updated_at: string;
}

export async function fetchAllContent(): Promise<ContentField[]> {
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .order("section", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ContentField[];
}

export async function fetchSectionContent(section: string): Promise<ContentField[]> {
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("section", section);

  if (error) throw error;
  return (data ?? []) as ContentField[];
}

export async function upsertContentField(
  section: string,
  fieldKey: string,
  fieldValue: string,
  fieldType: string = "text",
): Promise<ContentField> {
  const { data, error } = await supabase
    .from("site_content")
    .upsert(
      { section, field_key: fieldKey, field_value: fieldValue, field_type: fieldType, updated_at: new Date().toISOString() },
      { onConflict: "section,field_key" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as ContentField;
}

export async function deleteContentField(id: string): Promise<void> {
  const { error } = await supabase.from("site_content").delete().eq("id", id);
  if (error) throw error;
}