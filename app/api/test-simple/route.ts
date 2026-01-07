import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { message: 'API is working!', timestamp: new Date().toISOString() },
    { headers: { 'content-type': 'application/json' } }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json(
      { message: 'POST is working!', received: body },
      { headers: { 'content-type': 'application/json' } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to parse JSON' },
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }
}
