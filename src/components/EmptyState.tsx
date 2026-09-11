import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{title}</p>
      {description && <p className="text-xs text-neutral-400 max-w-xs">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
