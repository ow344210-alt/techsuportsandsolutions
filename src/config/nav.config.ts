export const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Projects", href: "/projects" },
  { name: "Process", href: "/process" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
] as const;

export type NavLink = typeof NAV_LINKS[number];