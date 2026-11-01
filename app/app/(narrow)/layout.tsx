import { PageLayout } from "@/components/page-layout";

// Forms and settings sit in the same text column as the feed (ADR-0004).
export default function NarrowLayout({ children }: { children: React.ReactNode }) {
  return <PageLayout>{children}</PageLayout>;
}
