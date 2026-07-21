"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";
import { changePin, updateDisplayName } from "@/app/actions/auth";
import { PinInput } from "@/components/pin-input";

const initial: AuthState = {};

export function SettingsForms({ displayName }: { displayName: string | null }) {
  const [pinState, pinAction, pinPending] = useActionState(changePin, initial);
  const [profileState, profileAction, profilePending] = useActionState(
    updateDisplayName,
    initial,
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="soft-panel sm:p-6">
        <p className="section-label">Profile</p>
        <h2 className="mt-1 text-lg font-semibold">Display name</h2>
        <form action={profileAction} className="mt-4 space-y-3">
          {profileState.error ? (
            <p className="text-sm text-red-600">{profileState.error}</p>
          ) : null}
          {profileState.success ? (
            <p className="text-sm text-emerald-600">{profileState.success}</p>
          ) : null}
          <input
            name="displayName"
            defaultValue={displayName ?? ""}
            placeholder="Your name"
            className="field"
          />
          <button
            type="submit"
            disabled={profilePending}
            className="btn-primary"
          >
            Save
          </button>
        </form>
      </section>

      <section className="soft-panel sm:p-6">
        <p className="section-label">Security</p>
        <h2 className="mt-1 text-lg font-semibold">Change PIN</h2>
        <p className="mt-1 text-sm text-stone-500">
          Used to sign in. Keep it private.
        </p>
        <form action={pinAction} className="mt-5 max-w-sm space-y-4">
          {pinState.error ? (
            <p className="text-sm text-red-600">{pinState.error}</p>
          ) : null}
          {pinState.success ? (
            <p className="text-sm text-emerald-600">{pinState.success}</p>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">
              Current PIN
            </label>
            <PinInput name="currentPin" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">
              New PIN
            </label>
            <PinInput name="newPin" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500">
              Confirm new PIN
            </label>
            <PinInput name="confirmPin" />
          </div>
          <button type="submit" disabled={pinPending} className="btn-primary">
            Update PIN
          </button>
        </form>
      </section>
    </div>
  );
}
