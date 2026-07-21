import Link from "next/link";
import { getDashboardStats, getTasks, getProfile } from "@/lib/data";

export default async function DashboardPage() {
  const [profile, stats, tasks] = await Promise.all([
    getProfile(),
    getDashboardStats(),
    getTasks(),
  ]);

  const focusTasks = tasks.filter((t) => t.status !== "done").slice(0, 4);
  const firstName =
    profile?.display_name?.trim().split(/\s+/)[0] ??
    profile?.email?.split("@")[0] ??
    "there";

  const cards = [
    { label: "Notes", value: stats?.notes ?? 0, href: "/notes?library=1" },
    { label: "Tasks", value: stats?.openTasks ?? 0, href: "/tasks" },
    { label: "Events", value: stats?.upcomingEvents ?? 0, href: "/calendar" },
  ];

  return (
    <div className="page-shell">
      <header className="mb-8 sm:mb-10">
        <p className="section-label">Home</p>
        <h1 className="page-title mt-2">Hello, {firstName}</h1>
        <p className="page-subtitle">A quiet overview of what matters today.</p>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            prefetch
            className="soft-panel group text-center transition hover:bg-stone-50 sm:text-left dark:hover:bg-stone-800/60"
          >
            <p className="text-[11px] text-stone-500 sm:text-sm">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight sm:mt-2 sm:text-4xl">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-8 sm:mt-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="section-label">Focus</p>
            <h2 className="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-50">
              Open tasks
            </h2>
          </div>
          <Link href="/tasks" className="btn-quiet text-xs sm:text-sm">
            View all
          </Link>
        </div>

        {focusTasks.length > 0 ? (
          <ul className="soft-panel divide-y divide-stone-100 p-0 dark:divide-stone-800">
            {focusTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                    {t.title}
                  </p>
                  {t.due_date ? (
                    <p className="mt-0.5 text-xs text-stone-500">Due {t.due_date}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] tracking-wide text-stone-400 uppercase">
                  {t.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="soft-panel py-10 text-center">
            <p className="text-sm text-stone-500">You&apos;re all caught up.</p>
            <Link href="/tasks" className="btn-quiet mt-3 inline-flex">
              Add a task
            </Link>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-3">
        <Link
          href="/notes"
          className="soft-panel transition hover:bg-stone-50 dark:hover:bg-stone-800/60"
        >
          <p className="section-label">Write</p>
          <p className="mt-2 text-base font-medium">Open notes</p>
          <p className="mt-1 text-sm text-stone-500">Draft and save quietly.</p>
        </Link>
        <Link
          href="/calendar"
          className="soft-panel transition hover:bg-stone-50 dark:hover:bg-stone-800/60"
        >
          <p className="section-label">Plan</p>
          <p className="mt-2 text-base font-medium">Open calendar</p>
          <p className="mt-1 text-sm text-stone-500">See what&apos;s coming up.</p>
        </Link>
      </div>
    </div>
  );
}
