import { NextResponse } from 'next/server';
import { applyPlanRanks } from '@/lib/boostProducts';
import { getAllSellerPlanRanks } from '@/lib/sellerSubscriptionStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/products/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const products = await response.json();
    const ranks = await getAllSellerPlanRanks();
    const boosted = applyPlanRanks(Array.isArray(products) ? products : products.products || [], ranks);
    return NextResponse.json(boosted);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}
