import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { message: 'API is working!', timestamp: new Date().toISOString() },
    { headers: { 'content-type': 'application/json' } }
  )
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }
    return NextResponse.json(
      { message: 'POST is working!', received: body },
      { headers: { 'content-type': 'application/json' } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
