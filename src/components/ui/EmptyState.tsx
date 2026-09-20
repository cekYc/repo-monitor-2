import type { ReactNode } from "react";

/** Empty state rule: one line of copy, at most one action. No illustrations,
 *  no secondary "learn more" links, never a bare blank area. */
export default function EmptyState({
  title,
  body,
  action,
  icon,
  className = "",
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`card-quiet px-6 py-10 flex flex-col items-center text-center gap-3 ${className}`}
    >
      {icon && <div className="text-faint">{icon}</div>}
      <div className="space-y-1">
        <p className="t-body font-medium text-fg">{title}</p>
        {body && <p className="t-caption text-faint max-w-sm">{body}</p>}
      </div>
      {action}
    </div>
  );
}
