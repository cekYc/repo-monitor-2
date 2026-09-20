import GitHubAvatar from "@/components/GitHubAvatar";

/** Avatar with an initial fallback, so a missing or sample profile picture
 *  still renders a solid shape instead of a broken image. */
export default function Avatar({
  src,
  label,
  size = 40,
  rounded = "full",
  className = "",
}: {
  src?: string;
  label: string;
  size?: number;
  rounded?: "full" | "lg";
  className?: string;
}) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-lg";

  if (!src) {
    return (
      <span
        aria-hidden
        className={`${radius} bg-panel-strong text-faint grid place-items-center shrink-0 font-medium ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size / 2.6) }}
      >
        {label.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <GitHubAvatar
      src={src}
      alt={label}
      identity={label}
      width={size}
      height={size}
      className={`${radius} shrink-0 ${className}`}
    />
  );
}
