"use client";

import { useRef } from "react";
import { normalizePinInput } from "@/lib/pin";

type PinInputProps = {
  name: string;
  id?: string;
  autoFocus?: boolean;
  required?: boolean;
};

export function PinInput({
  name,
  id,
  autoFocus,
  required = true,
}: PinInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <input
        ref={hiddenRef}
        type="password"
        name={name}
        id={id}
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        required={required}
        autoComplete={name === "pin" ? "current-password" : "new-password"}
        className="field text-center text-2xl tracking-[0.45em]"
        onChange={(e) => {
          e.target.value = normalizePinInput(e.target.value);
        }}
        autoFocus={autoFocus}
        placeholder="••••••"
      />
      <p className="text-center text-[11px] text-stone-400">6 digits</p>
    </div>
  );
}
