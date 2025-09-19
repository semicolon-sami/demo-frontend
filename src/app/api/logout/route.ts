import { NextResponse } from "next/server";

export async function POST() {
  // To truly log out, the client should clear its Supabase session (via JS SDK).
  // For server cookies, you'd clear them here:
  const res = NextResponse.json({ success: true, message: "Logged out" });
  res.headers.append(
    "Set-Cookie",
    "sb-access-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
  );
  // You can also clear other session cookies if set.
  return res;
}
