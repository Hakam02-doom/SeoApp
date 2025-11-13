import { NextRequest, NextResponse } from 'next/server';
import { polar } from '@/lib/polar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('polar-signature');

    // TODO: Verify webhook signature
    // TODO: Handle different webhook events
    // - subscription.created
    // - subscription.updated
    // - subscription.cancelled
    // - payment.succeeded
    // - payment.failed

    console.log('Polar webhook received:', body);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Polar webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
