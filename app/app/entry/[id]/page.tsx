import { redirect } from "next/navigation";
import { feedHref } from "@/lib/feed-filter";

// Entries open in place, in the feed (ADR-0005); keeps old links working.
export default async function EntryPage({ params }: PageProps<"/app/entry/[id]">) {
  const { id } = await params;
  redirect(feedHref({ categoryIds: [] }, { mode: "edit", id }));
}
