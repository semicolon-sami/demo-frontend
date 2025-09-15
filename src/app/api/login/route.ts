import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (
      username === process.env.LOGIN_USER &&
      password === process.env.LOGIN_PASS
    ) {
      // Set the 'authenticated' cookie on successful login
      const response = NextResponse.json({ success: true });
      response.cookies.set('authenticated', '1', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // one week
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
