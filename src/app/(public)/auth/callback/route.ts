import { NextResponse } from "next/server";

import { createClient } from "@/services/supabase/server";

function safeNextPath(next: string | null, origin: string): string {
  const fallback = "/conta";
  if (!next) {
    return fallback;
  }
  try {
    if (next.includes("://") || next.startsWith("//")) {
      const parsed = new URL(next, origin);
      if (parsed.origin !== new URL(origin).origin) {
        return fallback;
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (!next.startsWith("/")) {
      return fallback;
    }
    return next;
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(
    requestUrl.searchParams.get("next"),
    requestUrl.origin
  );

  if (!code) {
    const login = new URL("/login", requestUrl.origin);
    login.searchParams.set("error", "missing_code");
    login.searchParams.set("next", nextPath);
    return NextResponse.redirect(login);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const login = new URL("/login", requestUrl.origin);
    login.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
