import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'Use the Eraiiz login page' }, { status: 404 });
}
