import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    return NextResponse.json({ authenticated: false });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, user: data.user });
}
