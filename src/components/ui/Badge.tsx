import type { Role } from "@/types";

const colors: Record<Role, string> = {
  Admin: "bg-violet-100 text-violet-700",
  Treasurer: "bg-amber-100 text-amber-700",
  Member: "bg-sky-100 text-sky-700",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[role] || "bg-gray-100 text-gray-600"}`}
    >
      {role}
    </span>
  );
}
