import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'gpool-web',
    release: process.env.NEXT_PUBLIC_RELEASE ?? 'dev',
    components: {},
  });
}
