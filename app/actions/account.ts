"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { requireUserId } from "@/lib/db/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidTimeZone } from "@/lib/time";
import { profileSchema } from "@/lib/validation";
import type { FormState } from "./state";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function rememberLocale(locale: string) {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
}

/**
 * Called by the browser right after Google sign-in. On the first sign-in it
 * fills the profile's time zone and language from the browser (Tech Spec
 * §7.1a); later it only applies the saved language to the interface.
 */
export async function completeSignIn(browser: { timezone: string; locale: string }) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("locale, timezone").eq("id", userId).single();

  const patch: { timezone?: string; locale?: string } = {};
  if (!profile?.timezone && isValidTimeZone(browser.timezone)) patch.timezone = browser.timezone;
  if (!profile?.locale && isLocale(browser.locale)) patch.locale = browser.locale;
  if (Object.keys(patch).length > 0) await supabase.from("profiles").update(patch).eq("id", userId);

  const locale = profile?.locale ?? patch.locale;
  if (locale) await rememberLocale(locale);
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    locale: formData.get("locale"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "settings.errors.save" };
  const { displayName, locale, timezone } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, locale, timezone })
    .eq("id", userId);
  if (error) return { error: "settings.errors.save" };
  await rememberLocale(locale);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** DATA-02: deletes the auth user; ON DELETE CASCADE removes everything else. */
export async function deleteAccount(): Promise<FormState> {
  const userId = await requireUserId();
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) return { error: "settings.errors.delete" };
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?deleted=1");
}
