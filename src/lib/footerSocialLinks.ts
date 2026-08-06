// Manages the Footer's social-media strip — fully admin-editable. The public
// footer reads only enabled rows (in sort order), while authenticated admins
// can create, edit, reorder, enable/disable, and delete entries. Icons are
// resolved through a safe allowlist so arbitrary text stored in the database
// can never be turned into executable markup, and URLs are validated before
// they are ever shown as links.
import { supabase } from "../supabase/client";
import { cachedQuery } from "./dataCache";
import {
  FaFacebook,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLink,
  FaLinkedin,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

export interface FooterSocialLink {
  id: string;
  platform_key: string;
  label: string;
  url: string;
  link_type: string;
  icon_key: string;
  is_enabled: boolean;
  open_in_new_tab: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FooterSocialLinkPayload {
  platform_key: string;
  label: string;
  url: string;
  link_type: string;
  icon_key: string;
  is_enabled: boolean;
  open_in_new_tab: boolean;
}

export interface FooterSocialPlatform {
  key: string;
  label: string;
  iconKey: string;
}

// Presets shown in the admin form. Each platform carries its matching icon so
// a new entry starts with a sensible default; "custom" keeps the door open for
// any other network while still forcing an explicit, safe icon choice.
export const FOOTER_SOCIAL_PLATFORMS: FooterSocialPlatform[] = [
  { key: "instagram", label: "Instagram", iconKey: "instagram" },
  { key: "facebook", label: "Facebook", iconKey: "facebook" },
  { key: "linkedin", label: "LinkedIn", iconKey: "linkedin" },
  { key: "twitter", label: "X (Twitter)", iconKey: "twitter" },
  { key: "youtube", label: "YouTube", iconKey: "youtube" },
  { key: "whatsapp", label: "WhatsApp", iconKey: "whatsapp" },
  { key: "github", label: "GitHub", iconKey: "github" },
  { key: "website", label: "Website", iconKey: "globe" },
  { key: "custom", label: "Custom", iconKey: "link" },
];

export const FOOTER_SOCIAL_LINK_TYPES = ["social", "website", "other"] as const;

// Explicit icon choices exposed to the admin. Only these keys ever map to a
// real icon; anything else resolves to the neutral FaLink fallback.
export const FOOTER_SOCIAL_ICON_OPTIONS: Array<{ key: string; label: string }> =
  [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "twitter", label: "X (Twitter)" },
    { key: "youtube", label: "YouTube" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "github", label: "GitHub" },
    { key: "globe", label: "Website" },
    { key: "link", label: "Link" },
  ];

// Safe icon allowlist. Never index this map with untrusted input before
// checking membership — getFooterSocialIcon() does that for you.
const FOOTER_SOCIAL_ICON_MAP: Record<string, IconType> = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  twitter: FaXTwitter,
  x: FaXTwitter,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  github: FaGithub,
  globe: FaGlobe,
  website: FaGlobe,
  link: FaLink,
};

export function getFooterSocialIcon(
  iconKey: string | null | undefined,
): IconType {
  if (iconKey && iconKey in FOOTER_SOCIAL_ICON_MAP) {
    return FOOTER_SOCIAL_ICON_MAP[iconKey];
  }
  return FaLink;
}

// Only http/https are accepted as social destinations. Anything else —
// javascript:, data:, vbscript:, or a malformed string — is rejected before it
// can become a link on the public site.
export function isValidSocialUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return false;
  }
  return parsed.protocol === "https:" || parsed.protocol === "http:";
}

export function isKnownSocialPlatform(platformKey: string): boolean {
  return FOOTER_SOCIAL_PLATFORMS.some((p) => p.key === platformKey);
}

// Returns a human-readable error message, or null when the payload is valid.
export function validateFooterSocialLink(
  payload: FooterSocialLinkPayload,
): string | null {
  if (!payload.platform_key.trim()) return "Platform is required.";
  if (!isKnownSocialPlatform(payload.platform_key.trim())) {
    return "Unknown platform selected.";
  }
  if (!payload.label.trim()) return "Label is required.";
  const url = payload.url.trim();
  if (!url) return "URL is required.";
  if (!isValidSocialUrl(url)) return "URL must be a valid http(s) link.";
  return null;
}

// True when another row already claims this platform, used to keep each
// platform unique among the enabled links shown on the public footer.
export function isPlatformDuplicate(
  links: FooterSocialLink[],
  platformKey: string,
  currentId: string | null,
): boolean {
  return links.some(
    (link) =>
      link.platform_key === platformKey &&
      link.platform_key !== "custom" &&
      link.id !== currentId,
  );
}

export async function fetchActiveFooterSocialLinks(): Promise<
  FooterSocialLink[]
> {
  return cachedQuery("footer_social_links:enabled", async () => {
    const { data, error } = await supabase
      .from("footer_social_links")
      .select("*")
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as FooterSocialLink[];
  });
}

export async function fetchFooterSocialLinksForAdmin(): Promise<
  FooterSocialLink[]
> {
  const { data, error } = await supabase
    .from("footer_social_links")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FooterSocialLink[];
}

export async function createFooterSocialLink(
  payload: FooterSocialLinkPayload,
  nextSortOrder: number,
): Promise<FooterSocialLink> {
  const { data, error } = await supabase
    .from("footer_social_links")
    .insert([{ ...payload, sort_order: nextSortOrder }])
    .select()
    .single();

  if (error) throw error;
  return data as FooterSocialLink;
}

export async function updateFooterSocialLink(
  id: string,
  payload: FooterSocialLinkPayload,
): Promise<FooterSocialLink> {
  const { data, error } = await supabase
    .from("footer_social_links")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as FooterSocialLink;
}

export async function deleteFooterSocialLink(id: string): Promise<void> {
  const { error } = await supabase
    .from("footer_social_links")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function swapFooterSocialLinkOrder(
  a: FooterSocialLink,
  b: FooterSocialLink,
): Promise<void> {
  const { error: errorA } = await supabase
    .from("footer_social_links")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase
    .from("footer_social_links")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);
  if (errorB) throw errorB;
}
