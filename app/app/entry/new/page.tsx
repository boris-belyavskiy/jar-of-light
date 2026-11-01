import { redirect } from "next/navigation";

// New entries open in place, in the feed (ADR-0005); keeps old links working.
export default function NewEntryPage() {
  redirect("/app?new=1");
}
