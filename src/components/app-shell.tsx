"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";

const guestLinks = [{ href: "/notes", label: "Notes", short: "N" }] as const;

const userLinks = [
  { href: "/dashboard", label: "Home", short: "H" },
  { href: "/notes", label: "Notes", short: "N" },
  {
    href: "/notes?library=1",
    label: "Saved",
    short: "S",
    mobileOnly: true,
    match: "library",
  },
  { href: "/tasks", label: "Tasks", short: "T" },
  { href: "/calendar", label: "Calendar", short: "C" },
  { href: "/trash", label: "Trash", short: "X" },
  { href: "/settings", label: "Settings", short: "⚙" },
] as const;

const COLLAPSE_KEY = "notepad-nav-collapsed";
const COLLAPSE_EVENT = "notepad-nav-collapse";

function subscribeCollapse(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(COLLAPSE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(COLLAPSE_EVENT, onStoreChange);
  };
}

function getCollapseSnapshot() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function getCollapseServerSnapshot() {
  return false;
}

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
  const links = isLoggedIn ? userLinks : guestLinks;
  const collapsed = useSyncExternalStore(
    subscribeCollapse,
    getCollapseSnapshot,
    getCollapseServerSnapshot,
  );

  const toggleCollapsed = useCallback(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
      window.dispatchEvent(new Event(COLLAPSE_EVENT));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside
        className={`sticky top-0 z-30 border-b border-stone-200/80 bg-[var(--background)]/95 backdrop-blur transition-[width] duration-200 lg:flex lg:h-dvh lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0 dark:border-stone-800 ${
          collapsed ? "lg:w-[4.25rem]" : "lg:w-52"
        }`}
      >
        <div
          className={`flex items-start gap-2 px-4 py-4 lg:px-4 lg:py-5 ${
            collapsed ? "lg:flex-col lg:items-center" : ""
          }`}
        >
          <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              Notepad
            </p>
            <p className="mt-0.5 truncate text-xs text-stone-500">
              {isLoggedIn ? displayName || "Signed in" : "Guest"}
            </p>
          </div>
          {collapsed ? (
            <p className="hidden text-sm font-semibold text-stone-900 lg:block dark:text-stone-50">
              N
            </p>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-md p-1.5 text-stone-500 transition hover:bg-stone-200/60 hover:text-stone-800 lg:inline-flex dark:hover:bg-stone-800 dark:hover:text-stone-200"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <span className="text-sm" aria-hidden>
              {collapsed ? "»" : "«"}
            </span>
          </button>
        </div>

        <nav
          className={`flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-2 lg:pb-4 ${
            collapsed ? "lg:items-center" : ""
          }`}
          aria-label="Main"
        >
          {links.map((link) => {
            const mobileOnly = "mobileOnly" in link && link.mobileOnly;
            const isLibrary = "match" in link && link.match === "library";
            const active = isLibrary
              ? false
              : pathname === link.href ||
                (link.href !== "/dashboard" &&
                  !link.href.includes("?") &&
                  pathname.startsWith(link.href));

            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                prefetch
                title={link.label}
                className={`${mobileOnly ? "lg:hidden" : ""} group relative whitespace-nowrap px-3 py-2 text-sm transition lg:w-full ${
                  collapsed ? "lg:flex lg:justify-center lg:px-2" : ""
                } ${
                  active
                    ? "font-medium text-stone-900 dark:text-stone-50"
                    : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                }`}
              >
                <span
                  className={`absolute top-1/2 left-0 hidden h-5 w-0.5 -translate-y-1/2 rounded-full bg-stone-900 transition dark:bg-stone-100 lg:block ${
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                  } ${collapsed ? "lg:left-1" : ""}`}
                  aria-hidden
                />
                <span className={collapsed ? "lg:hidden" : ""}>{link.label}</span>
                <span className={`hidden ${collapsed ? "lg:inline" : ""}`}>
                  {link.short}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={`hidden lg:block ${collapsed ? "px-2 pb-3" : "px-3 pb-3"}`}
        >
          {isLoggedIn ? (
            <form action={signOut}>
              <button
                type="submit"
                title="Sign out"
                className={`w-full py-2 text-left text-sm text-stone-500 transition hover:text-stone-900 dark:hover:text-stone-200 ${
                  collapsed ? "text-center" : "px-3"
                }`}
              >
                {collapsed ? "⎋" : "Sign out"}
              </button>
            </form>
          ) : (
            <div className={`flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
              <Link
                href="/login?next=/notes"
                title="Sign in"
                className={`py-2 text-sm font-medium text-stone-900 dark:text-stone-100 ${
                  collapsed ? "text-center" : "px-3"
                }`}
              >
                {collapsed ? "→" : "Sign in"}
              </Link>
              {!collapsed ? (
                <Link
                  href="/signup?next=/notes"
                  className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Sign up
                </Link>
              ) : null}
            </div>
          )}
        </div>

        <p
          className={`mt-auto hidden pb-5 text-[10px] leading-relaxed text-stone-400 lg:block ${
            collapsed ? "px-2 text-center" : "px-5"
          }`}
        >
          {collapsed ? (
            "JPP"
          ) : (
            <>
              Made by{" "}
              <span className="font-medium text-stone-500">
                John Paul Polendey
              </span>
            </>
          )}
        </p>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!isLoggedIn ? (
          <div className="flex items-center justify-end gap-3 border-b border-stone-200/70 px-4 py-2 lg:hidden dark:border-stone-800">
            <Link
              href="/signup?next=/notes"
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Sign up
            </Link>
            <Link
              href="/login?next=/notes"
              className="text-xs font-medium text-stone-900 dark:text-stone-100"
            >
              Sign in
            </Link>
          </div>
        ) : null}
        <main className="flex-1">{children}</main>
        <footer className="px-4 py-4 text-center text-[11px] text-stone-400 sm:py-5">
          Made by{" "}
          <span className="font-medium text-stone-500">John Paul Polendey</span>
        </footer>
      </div>
    </div>
  );
}
