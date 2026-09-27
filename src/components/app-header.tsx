import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { supabase } from "@/integrations/supabase/client";

/**
 * Header used across the signed-in app. Two hidden admin entry points live
 * here: a long-press on the logo, and three quick taps on "My Dashboard".
 */
export function AppHeader({ unlockedCount }: { unlockedCount?: number }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const taps = useRef<number[]>([]);

  const onDashboardTap = () => {
    const now = Date.now();
    taps.current = [...taps.current, now].filter((t) => now - t < 2000);
    if (taps.current.length >= 3) {
      taps.current = [];
      navigate({ to: "/admin" });
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="flex items-center justify-between gap-3">
      <Link to="/dashboard" className="flex items-center gap-2">
        <BrandLogo />
        <span className="font-display text-[15px] font-semibold tracking-tight">
          Eminent Clicks
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {typeof unlockedCount === "number" ? (
          <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
            {unlockedCount} of 5 open
          </span>
        ) : null}
        <button
          onClick={onDashboardTap}
          className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-foreground ring-1 ring-border"
        >
          My Dashboard
        </button>
        <button
          onClick={signOut}
          className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
