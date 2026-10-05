export function Logo({ name, dark = false }: { name: string; dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="8" fill={dark ? "#dc2626" : "#fff"} />
        <rect x="7" y="9" width="20" height="13" rx="2" fill={dark ? "#fff" : "#dc2626"} />
        <path d="M4 24h26l-2 3H6z" fill={dark ? "#fff" : "#dc2626"} />
      </svg>
      <span className={`text-lg font-bold tracking-tight md:text-xl ${dark ? "text-gray-900" : "text-white"}`}>{name}</span>
    </span>
  );
}
