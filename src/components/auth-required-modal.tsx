"use client";

import Link from "next/link";

export function AuthRequiredModal({
  open,
  onClose,
  nextPath = "/notes",
}: {
  open: boolean;
  onClose: () => void;
  nextPath?: string;
}) {
  if (!open) return null;

  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-stone-950/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[var(--surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="section-label">Save</p>
        <h2
          id="auth-required-title"
          className="mt-2 text-xl font-semibold text-stone-900 dark:text-stone-50"
        >
          Sign in to save
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          You can keep writing as a guest. To save this note, sign in or create
          an account first — your draft will be waiting.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href={loginHref} className="btn-primary w-full text-center">
            Sign in
          </Link>
          <Link href={signupHref} className="btn-quiet w-full text-center">
            Create account
          </Link>
          <button type="button" onClick={onClose} className="btn-quiet w-full">
            Keep writing
          </button>
        </div>
      </div>
    </div>
  );
}
