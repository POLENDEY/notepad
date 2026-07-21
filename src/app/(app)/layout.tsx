import { AppShell } from "@/components/app-shell";
import { getProfile, getSessionUser } from "@/lib/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const profile = user ? await getProfile() : null;

  return (
    <AppShell
      isLoggedIn={!!user}
      displayName={profile?.display_name ?? profile?.email}
    >
      {children}
    </AppShell>
  );
}
