import { Briefcase, Code2, Feather, Gamepad2, Laptop, Palette, type LucideProps } from "lucide-react";

const MAP = { briefcase: Briefcase, gamepad: Gamepad2, palette: Palette, feather: Feather, code: Code2 };

export function CategoryIcon({ icon, ...props }: { icon?: string | null } & Omit<LucideProps, "name">) {
  const Icon = MAP[icon as keyof typeof MAP] ?? Laptop;
  return <Icon {...props} />;
}
