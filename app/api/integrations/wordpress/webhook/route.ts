import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { handleAPIError, successResponse } from '@/lib/api/error-handler';
import { z } from 'zod';

const webhookSchema = z.object({
  event: z.enum(['post.published', 'post.updated', 'post.deleted', 'post.unpublished']),
  data: z.object({
    post_id: z.number(),
    title: z.string(),
    url: z.string().url(),
    status: z.string(),
    published_at: z.string().optional(),
    modified_at: z.string().optional(),
  }),
  timestamp: z.string(),
  site_url: z.string().url(),
});

// POST /api/integrations/wordpress/webhook - Receive webhooks from WordPress
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get('integration_id');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integration_id is required' },
        { status: 400 }
      );
    }

    // Verify integration exists
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      include: { project: true },
    });

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { error: 'Integration not found or inactive' },
        { status: 404 }
      );
    }

    // Verify webhook signature (optional, but recommended)
    // const signature = req.headers.get('X-RankYak-Signature');
    // if (!verifySignature(body, signature, integration.webhook_secret)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const body = await req.json();
    const validated = webhookSchema.parse(body);

    // Handle different webhook events
    switch (validated.event) {
      case 'post.published':
      case 'post.updated':
        // Find article by WordPress post URL or create mapping
        // For now, we'll just log it
        console.log('[WordPress Webhook] Post published/updated:', validated.data);
        break;

      case 'post.deleted':
      case 'post.unpublished':
        // Handle post deletion/unpublishing
        console.log('[WordPress Webhook] Post deleted/unpublished:', validated.data);
        break;
    }

    // Update last sync time
    await db.integration.update({
      where: { id: integrationId },
      data: {
        lastSyncAt: new Date(),
      },
    });

    return successResponse({
      received: true,
      event: validated.event,
    });
  } catch (error) {
    console.error('[WordPress Webhook] Error:', error);
    return handleAPIError(error);
  }
}

