import { AppShell } from "@/components/app-shell";
import { requireUserId } from "@/lib/db/queries";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  await requireUserId();
  return <AppShell>{children}</AppShell>;
}
