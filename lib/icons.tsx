import {
  Shirt,
  Laptop,
  Code2,
  Plane,
  Home,
  Sparkles,
  HeartPulse,
  PawPrint,
  Tag,
  Heart,
  Egg,
  Flower2,
  User,
  Ghost,
  UtensilsCrossed,
  Gift,
  Package,
  type LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  Shirt,
  Laptop,
  Code2,
  Plane,
  Home,
  Sparkles,
  HeartPulse,
  PawPrint,
  Tag,
  Heart,
  Egg,
  Flower2,
  User,
  Ghost,
  UtensilsCrossed,
  Gift,
  Package,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Tag;
}

export function renderIcon(name: string, className?: string) {
  const Icon = iconMap[name] ?? Tag;
  return <Icon className={className} />;
}
