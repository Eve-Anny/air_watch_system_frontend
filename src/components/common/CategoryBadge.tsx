import type { Category } from "../../types";
import { categoryStatus, STATUS_BG_CLASS, STATUS_TEXT_CLASS, STATUS_WASH_CLASS } from "../../statusColors";
import { StatusIcon } from "./StatusIcon";

interface Props {
  category: Category;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft";
}

export function CategoryBadge({ category, size = "md", variant = "solid" }: Props) {
  const role = categoryStatus(category);
  const sizeClasses =
    size === "lg" ? "text-base px-3 py-1.5 gap-2" : size === "sm" ? "text-xs px-2 py-0.5 gap-1" : "text-sm px-2.5 py-1 gap-1.5";
  const colorClasses = variant === "solid" ? `text-white ${STATUS_BG_CLASS[role]}` : `${STATUS_TEXT_CLASS[role]} ${STATUS_WASH_CLASS[role]}`;

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClasses} ${sizeClasses}`}>
      <StatusIcon role={role} className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} />
      {category}
    </span>
  );
}
