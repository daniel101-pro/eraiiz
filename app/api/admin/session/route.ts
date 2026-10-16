import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin(request);
  if (error) return error;
  return NextResponse.json(session);
}
