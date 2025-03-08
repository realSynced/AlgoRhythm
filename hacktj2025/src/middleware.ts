import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createClient } from "@/utils/supabase/server";

function isMobileDevice(userAgent: string): boolean {
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}

export async function middleware(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (
    (session && request.nextUrl.pathname === "/") ||
    (session && request.nextUrl.pathname === "/login")
  ) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  if (!session && request.nextUrl.pathname !== "/login" && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/"],
};
