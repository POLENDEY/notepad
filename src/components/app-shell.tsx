"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";

export function AppShell({
  children,
  displayName,
  isLoggedIn = false,
}: {
  children: React.ReactNode;
  displayName?: string | null;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();
  const onNotes = pathname.startsWith("/notes");

  // Notes page is distraction-free — no sidebar
  if (onNotes) {
    return <div className="flex min-h-dvh flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-3 border-b border-stone-200/80 px-4 py-3 dark:border-stone-800">
        <Link
          href="/notes"
          className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-50"
        >
          Notepad
        </Link>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href="/notes"
            className="rounded-md px-2 py-1 text-stone-600 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Notes
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href="/settings"
                className="rounded-md px-2 py-1 text-stone-600 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Settings
              </Link>
              <span className="hidden text-xs text-stone-400 sm:inline">
                {displayName}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md px-2 py-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login?next=/notes" className="rounded-md px-2 py-1">
                Sign in
              </Link>
              <Link href="/signup?next=/notes" className="btn-primary !px-3 !py-1 text-xs">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
