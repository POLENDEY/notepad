import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/auth-cookie-options";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...AUTH_COOKIE_OPTIONS,
            ...options,
            maxAge: AUTH_COOKIE_OPTIONS.maxAge,
          }),
        );
      },
    },
  });

  // Refresh session so long-lived cookies stay valid across restarts
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") || path.startsWith("/signup");
  // Guests can write notes; save prompts them to sign in
  const isGuestOk = path === "/" || path === "/notes";

  if (!user && !isAuthRoute && !isGuestOk) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = next && next.startsWith("/") ? next : "/notes";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (path === "/" || path === "/dashboard" || path === "/tasks" || path === "/calendar" || path === "/trash") {
    const url = request.nextUrl.clone();
    url.pathname = "/notes";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
