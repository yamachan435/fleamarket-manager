import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  
  return NextResponse.json({
    authenticated: authToken === 'authenticated'
  })
}