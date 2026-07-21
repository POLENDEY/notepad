import { Suspense } from "react";
import { SignUpForm } from "@/components/signup-form";

export default function SignUpPage() {
  return (
    <div className="auth-card">
      <p className="section-label text-center">Join</p>
      <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        Create account
      </h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        Pick a 6-digit PIN you&apos;ll use to sign in.
      </p>
      <div className="mt-8">
        <Suspense
          fallback={
            <p className="text-center text-sm text-stone-400">Loading…</p>
          }
        >
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
