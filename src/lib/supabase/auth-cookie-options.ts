/** Session cookies persist across browser/device restarts until explicit sign-out. */
export const AUTH_COOKIE_OPTIONS = {
  // ~10 years; browsers may clamp (e.g. Chrome ~400 days) — still “until logout” in practice
  maxAge: 60 * 60 * 24 * 365 * 10,
  path: "/",
  sameSite: "lax" as const,
};
