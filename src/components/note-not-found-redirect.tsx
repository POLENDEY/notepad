"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NoteNotFoundRedirect({
  title = "Note not found",
  message = "This note doesn’t exist or was removed.",
  href = "/notes",
  delayMs = 2200,
}: {
  title?: string;
  message?: string;
  href?: string;
  delayMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setTimeout(() => {
      router.replace(href);
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [router, href, delayMs]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--background)] px-6 text-center">
      <p className="text-[11px] font-medium tracking-[0.16em] text-stone-500 uppercase">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        {title}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-stone-500">{message}</p>
      <p className="mt-6 text-xs text-stone-400">
        Taking you back to Notepad…
      </p>
      <Link href={href} className="btn-primary mt-5">
        Open Notepad
      </Link>
    </div>
  );
}
