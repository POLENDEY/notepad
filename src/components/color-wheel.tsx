"use client";

import { useId, useState } from "react";

type ColorWheelProps = {
  name: string;
  defaultValue?: string;
  label?: string;
  className?: string;
};

export function ColorWheel({
  name,
  defaultValue = "#fef9c3",
  label = "Color",
  className = "",
}: ColorWheelProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 text-xs text-stone-700 dark:text-stone-200 ${className}`}
      title={label}
    >
      <span className="sr-only">{label}</span>
      <input
        id={id}
        type="color"
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded-md border border-stone-300 bg-transparent p-0 dark:border-stone-600"
      />
      <span className="font-mono text-[11px] uppercase">{value}</span>
    </label>
  );
}
