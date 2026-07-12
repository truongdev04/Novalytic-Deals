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
  Book,
  Package,
  GraduationCap,
  Baby,
  Utensils,
  Car,
  Gamepad2,
  ToyBrick,
  Store,
  Bot,
  Palette,
  Handshake,
  Cigarette,
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
  Book,
  Package,
  GraduationCap,
  Baby,
  Utensils,
  Car,
  Gamepad2,
  ToyBrick,
  Store,
  Bot,
  Palette,
  Handshake,
  Cigarette
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Tag;
}

export function renderIcon(name: string, className?: string) {
  const Icon = iconMap[name] ?? Tag;
  return <Icon className={className} />;
}

export function renderCategoryIcon(
  category: { name: string; iconName?: string; iconImageUrl?: string },
  options: { iconClassName: string }
) {
  if (category.iconName && iconMap[category.iconName]) {
    return renderIcon(category.iconName, options.iconClassName);
  }
  if (category.iconImageUrl) {
    // Mask the uploaded image with the badge's `currentColor` instead of
    // painting it directly — keeps custom icon uploads visually consistent
    // with the lucide icon set (single brand-color tone, centered, padded)
    // instead of showing a full-color image edge-to-edge in the badge.
    return (
      <span
        role="img"
        aria-label={category.name}
        className="absolute inset-0 h-full w-full bg-current"
        style={{
          WebkitMaskImage: `url(${category.iconImageUrl})`,
          maskImage: `url(${category.iconImageUrl})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "55%",
          maskSize: "55%",
        }}
      />
    );
  }
  return renderIcon("", options.iconClassName);
}
