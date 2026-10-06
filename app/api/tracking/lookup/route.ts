import { NextRequest, NextResponse } from 'next/server';
import { lookupShipment } from '@/lib/trackingLookup';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const number = request.nextUrl.searchParams.get('number') || '';
  const result = await lookupShipment(number);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }
  return NextResponse.json(result);
}
