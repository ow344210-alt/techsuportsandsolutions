import {
  Monitor,
  Wrench,
  ShieldCheck,
  Cloud,
  Settings,
  Headphones,
  Code,
  Smartphone,
  Database,
  Server,
  Globe,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ServiceIcon } from "./services";

export const SERVICE_ICON_MAP: Record<ServiceIcon, LucideIcon> = {
  Monitor,
  Wrench,
  ShieldCheck,
  Cloud,
  Settings,
  Headphones,
  Code,
  Smartphone,
  Database,
  Server,
  Globe,
  Lock,
};

export function getServiceIcon(icon: ServiceIcon): LucideIcon {
  return SERVICE_ICON_MAP[icon] ?? Monitor;
}