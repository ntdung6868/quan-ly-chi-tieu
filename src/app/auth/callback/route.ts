import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

function getOrigin(request: Request): string {
  // On reverse proxy (cPanel/LiteSpeed), request.url has internal host.
  // Use x-forwarded-host or host header instead.
  const hdrs = Object.fromEntries(new URL(request.url).searchParams);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) return `${proto}://${forwardedHost}`;
  if (host && !host.startsWith("0.0.0.0") && !host.startsWith("127.0.0.1")) return `${proto}://${host}`;

  // Fallback to request.url origin
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
