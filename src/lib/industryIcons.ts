// Shared industry → icon resolution used by both the Industries section and
// the Services page. Keys are matched against industry names so CMS-managed
// industries get a sensible icon without per-item configuration.
import {
  Briefcase,
  Building2,
  Car,
  Factory,
  GraduationCap,
  HardHat,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Plane,
  Rocket,
  ShoppingBag,
  TrendingUp,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const INDUSTRY_ICONS: Array<[RegExp, LucideIcon]> = [
  [/health/i, HeartPulse],
  [/educ/i, GraduationCap],
  [/financ/i, TrendingUp],
  [/restaurant|food|hospitality/i, UtensilsCrossed],
  [/retail|ecommerce|e-commerce/i, ShoppingBag],
  [/construction/i, HardHat],
  [/real estate|property/i, Building2],
  [/travel|tour|hotel/i, Plane],
  [/automotive|auto|vehicle/i, Car],
  [/manufactur/i, Factory],
  [/logistic|transport/i, Truck],
  [/ngo|nonprofit|charity/i, HeartHandshake],
  [/startup/i, Rocket],
  [/enterprise/i, Landmark],
];

const FALLBACK_ICON: LucideIcon = Briefcase;

export function getIndustryIcon(name: string): LucideIcon {
  for (const [pattern, icon] of INDUSTRY_ICONS) {
    if (pattern.test(name)) return icon;
  }
  return FALLBACK_ICON;
}
