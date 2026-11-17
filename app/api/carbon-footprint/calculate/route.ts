import { NextRequest, NextResponse } from 'next/server';
import { CARBON_MODEL_VERSION, calculateCarbonFootprint } from '@/lib/carbonFootprint';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sustainabilityData = body.sustainabilityData || body.sustainability || body;

    const carbonFootprint = calculateCarbonFootprint(sustainabilityData);

    return NextResponse.json({
      success: true,
      data: {
        modelVersion: CARBON_MODEL_VERSION,
        carbonFootprint,
        summary: {
          savingsVsConventional: carbonFootprint.savingsVsConventional,
          equivalentCarRide: carbonFootprint.equivalentCarRide,
          treesToOffset: carbonFootprint.treesToOffset,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate carbon footprint';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
