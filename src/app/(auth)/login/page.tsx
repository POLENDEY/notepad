import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="auth-card">
      <p className="section-label text-center">Welcome</p>
      <h1 className="mt-2 text-center text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        Sign in
      </h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        Use your email and 6-digit PIN.
      </p>
      <div className="mt-8">
        <Suspense
          fallback={
            <p className="text-center text-sm text-stone-400">Loading…</p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
