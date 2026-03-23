import { DashboardShell } from "@/components/layout/dashboard-shell";

// Auth is handled by middleware — no server check needed here.
// This makes navigation between dashboard pages instant.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
