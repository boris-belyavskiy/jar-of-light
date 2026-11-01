import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { SettingsForm } from "@/components/journal/settings-form";
import { getProfile } from "@/lib/db/queries";
import { timeZoneOptions } from "@/lib/time";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("settings"))("title") };
}

export default async function SettingsPage() {
  const [profile, t] = await Promise.all([getProfile(), getTranslations("settings")]);
  const timeZones = Intl.supportedValuesOf("timeZone");
  if (!timeZones.includes(profile.timezone)) timeZones.unshift(profile.timezone);

  return (
    <PageLayout head={<h1 className="font-heading text-2xl font-semibold">{t("title")}</h1>}>
      <SettingsForm profile={profile} timeZones={timeZoneOptions(timeZones)} />
    </PageLayout>
  );
}
