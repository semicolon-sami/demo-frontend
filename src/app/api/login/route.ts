import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Store these in .env for security!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  const { email, username, password, loginInput } = await request.json();

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Determine whether the user entered email or username
  let userEmail = email || "";
  // If using a common input field "loginInput" for email/username
  if (loginInput && !email) {
    if (loginInput.includes("@")) {
      userEmail = loginInput;
    } else {
      // Lookup user by username in profiles → get auth.users id → get email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", loginInput)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: "Username not found" },
          { status: 401 },
        );
      }

      // Look up the auth user to get their email
      const { data: user } = await supabase.auth.admin.getUserById(profile.id);
      if (!user?.user?.email) {
        return NextResponse.json(
          { success: false, error: "Email not found for username" },
          { status: 401 },
        );
      }
      userEmail = user.user.email;
    }
  }

  // Now perform the sign in by email
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Login failed" },
      { status: 401 },
    );
  }

  // Return what you want—token, user info, etc
  return NextResponse.json({
    success: true,
    user: data.user,
    access_token: data.session.access_token,
  });
}
