"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
  { href: "/wallets", label: "Ví", icon: Wallet },
  { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  function handleNav(href: string) {
    setPendingHref(href);
    router.push(href);
  }

  const activePath = pendingHref ?? pathname;
  if (pendingHref && pathname === pendingHref) {
    queueMicrotask(() => setPendingHref(null));
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
      <div className="flex items-center justify-around h-14 pt-1">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? activePath === "/"
            : activePath.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors min-w-14",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
