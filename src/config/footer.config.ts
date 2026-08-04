export const FOOTER_CONTACT = {
  email: "techsupportsandsolutions@gmail.com",
  phone: "+92 3372579655",
  address: "Head Quarter Karachi, Sindh, Pakistan",
} as const;

export const FOOTER_SOCIAL = [
  { url: "", icon: "Facebook", label: "Facebook" },
  { url: "https://www.instagram.com/techsupportsandsolutions/", icon: "Instagram", label: "Instagram" },
  { url: "", icon: "LinkedIn", label: "LinkedIn" },
  { url: "", icon: "Twitter", label: "Twitter" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { name: "About Us", href: "/about" },
  { name: "Our Process", href: "/process" },
  { name: "Projects", href: "/projects" },
  { name: "Contact", href: "/contact" },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
] as const;

export const FOOTER_CONTACT_LINK = {
  name: "Contact Us",
  href: "/contact",
} as const;

export const EXTERNAL_LINK_PATTERNS = [
  /^https?:\/\//i,
] as const;

function isValidExternalLink(url: string): boolean {
  return EXTERNAL_LINK_PATTERNS.some((pattern) => pattern.test(url));
}

export function validateExternalLink(url: string): boolean {
  return isValidExternalLink(url);
}