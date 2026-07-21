import { getProfile } from "@/lib/data";
import { SettingsForms } from "@/components/settings-forms";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="page-shell max-w-xl">
      <header className="mb-6 sm:mb-8">
        <p className="section-label">Account</p>
        <h1 className="page-title mt-2">Settings</h1>
        <p className="page-subtitle">Name and PIN — that’s it.</p>
      </header>
      <SettingsForms displayName={profile?.display_name ?? null} />
    </div>
  );
}
