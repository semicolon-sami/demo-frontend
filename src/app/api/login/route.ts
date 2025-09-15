export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pw = body.password;
    if (!pw || pw !== process.env.BASIC_PASS) {
      return new Response(JSON.stringify({ ok: false }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // set httpOnly cookie
    const cookie = `authenticated=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Set-Cookie": cookie,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
}
