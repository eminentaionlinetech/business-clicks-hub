import { useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import logoAsset from "@/assets/eminent-clicks-logo.png.asset.json";

/**
 * Round logo mark. Long-pressing it for 1.5s opens the admin area
 * (one of the hidden admin entry points).
 */
export function BrandLogo({ size = 36 }: { size?: number }) {
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    clear();
    timer.current = setTimeout(() => {
      navigate({ to: "/admin" });
    }, 1500);
  };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <span
      role="img"
      aria-label="Eminent Clicks"
      className="no-touch-callout grid shrink-0 place-items-center overflow-hidden rounded-full bg-ice ring-1 ring-border"
      style={{ width: size, height: size }}
      onPointerDown={start}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={logoAsset.url}
        alt=""
        draggable={false}
        className="h-full w-full scale-125 object-contain p-0.5"
      />
    </span>
  );
}
