"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AuthState } from "@/app/actions/auth";
import { signUp } from "@/app/actions/auth";
import { PinInput } from "@/components/pin-input";

const initial: AuthState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);
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
          htmlFor="displayName"
          className="mb-1.5 block text-xs font-medium text-stone-500"
        >
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          className="field"
        />
      </div>
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
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          PIN
        </label>
        <PinInput name="pin" id="pin" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Confirm PIN
        </label>
        <PinInput name="confirmPin" id="confirmPin" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-stone-900 underline-offset-2 hover:underline dark:text-stone-100"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
