import {
  Archive,
  Baby,
  Bell,
  BookOpen,
  Briefcase,
  Camera,
  Clock,
  Cloud,
  Code2,
  Coffee,
  Cpu,
  DraftingCompass,
  Dumbbell,
  Flame,
  Folder as FolderIcon,
  GraduationCap,
  Heart,
  Home,
  Image,
  Languages,
  Layers,
  Leaf,
  Lightbulb,
  type LucideIcon,
  Music,
  Pencil,
  PenLine,
  Plane,
  Rocket,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Target,
  Trophy,
  User,
  Wallet,
  Wrench,
} from "lucide-react";

export const PICKER_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Folder", icon: FolderIcon },
  { name: "BookOpen", icon: BookOpen },
  { name: "PenLine", icon: PenLine },
  { name: "Pencil", icon: Pencil },
  { name: "Sparkles", icon: Sparkles },
  { name: "Archive", icon: Archive },
  { name: "Heart", icon: Heart },
  { name: "Star", icon: Star },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Rocket", icon: Rocket },
  { name: "Flame", icon: Flame },
  { name: "Target", icon: Target },
  { name: "Trophy", icon: Trophy },
  { name: "Briefcase", icon: Briefcase },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Code2", icon: Code2 },
  { name: "Cpu", icon: Cpu },
  { name: "Layers", icon: Layers },
  { name: "Wrench", icon: Wrench },
  { name: "DraftingCompass", icon: DraftingCompass },
  { name: "Home", icon: Home },
  { name: "Plane", icon: Plane },
  { name: "Camera", icon: Camera },
  { name: "Music", icon: Music },
  { name: "Image", icon: Image },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Wallet", icon: Wallet },
  { name: "Tag", icon: Tag },
  { name: "Cloud", icon: Cloud },
  { name: "Bell", icon: Bell },
  { name: "Clock", icon: Clock },
  { name: "Coffee", icon: Coffee },
  { name: "Leaf", icon: Leaf },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Languages", icon: Languages },
  { name: "Baby", icon: Baby },
  { name: "User", icon: User },
];

const PICKER_ICON_MAP = new Map<string, LucideIcon>(
  PICKER_ICONS.map(({ name, icon }) => [name, icon] as [string, LucideIcon]),
);

const LEGACY_ICON_MAP: Record<string, string> = {
  folder: "Folder",
  book: "BookOpen",
  pen: "PenLine",
  sparkles: "Sparkles",
  archive: "Archive",
  heart: "Heart",
};

export function normalizeIconName(icon?: string) {
  if (!icon) return "Folder";
  return LEGACY_ICON_MAP[icon] ?? icon;
}

export function getFolderIcon(icon?: string): LucideIcon {
  const name = normalizeIconName(icon);
  return PICKER_ICON_MAP.get(name) ?? FolderIcon;
}
