import { NextResponse } from 'next/server';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';

export async function GET() {
  try {
    const ranks = await getAllSellerPlanRanks();
    return NextResponse.json({ ranks });
  } catch (error) {
    console.error('Failed to load plan ranks', error);
    return NextResponse.json({ ranks: {} });
  }
}
