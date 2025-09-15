export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const authenticated = cookieHeader.includes('authenticated=1')
  return new Response(JSON.stringify({ authenticated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
