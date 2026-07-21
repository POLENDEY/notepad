"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AuthState } from "@/app/actions/auth";
import { signInWithPin } from "@/app/actions/auth";
import { PinInput } from "@/components/pin-input";

const initial: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signInWithPin, initial);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/notes";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-medium text-stone-500"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
        />
      </div>
      <div>
        <label
          htmlFor="pin"
          className="mb-1.5 block text-xs font-medium text-stone-500"
        >
          PIN
        </label>
        <PinInput name="pin" id="pin" autoFocus />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-stone-500">
        New here?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-stone-900 underline-offset-2 hover:underline dark:text-stone-100"
        >
          Create account
        </Link>
      </p>
    </form>
  );
}
