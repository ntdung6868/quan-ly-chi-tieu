"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient, getCachedUserId } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id: string } } | null) => {
        if (session?.user) {
          setChecked(true);
        } else {
          // Force full redirect to clear all client state
          window.location.href = "/login";
        }
      }
    );

    // Fallback: if userId is already cached (listener fired before mount)
    if (getCachedUserId()) {
      setChecked(true);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!checked) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-4 p-4 md:p-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
