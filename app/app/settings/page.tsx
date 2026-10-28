import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/journal/settings-form";
import { getProfile } from "@/lib/db/queries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("settings"))("title") };
}

export default async function SettingsPage() {
  const [profile, t] = await Promise.all([getProfile(), getTranslations("settings")]);
  const timeZones = Intl.supportedValuesOf("timeZone");
  if (!timeZones.includes(profile.timezone)) timeZones.unshift(profile.timezone);

  return (
    <>
      <h1 className="mb-6 font-heading text-2xl font-semibold">{t("title")}</h1>
      <SettingsForm profile={profile} timeZones={timeZones} />
    </>
  );
}
