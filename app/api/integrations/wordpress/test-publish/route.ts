import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth-middleware';
import { handleAPIError, successResponse, APIError, ErrorCode } from '@/lib/api/error-handler';
import { WordPressIntegration } from '@/lib/integrations/wordpress';

// POST /api/integrations/wordpress/test-publish - Test WordPress publishing
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      throw new APIError(400, 'Project ID is required', ErrorCode.MISSING_PROJECT_ID);
    }

    // Get project first
    const project = await db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new APIError(404, 'Project not found', ErrorCode.NOT_FOUND);
    }

    // Get WordPress integration separately to ensure we get all data
    const integration = await db.integration.findFirst({
      where: {
        projectId,
        platform: 'wordpress',
      },
    });

    console.log('[Test Publish] ========================================');
    console.log('[Test Publish] Project ID:', projectId);
    console.log('[Test Publish] User ID:', userId);
    console.log('[Test Publish] Integration found:', !!integration);
    if (integration) {
      console.log('[Test Publish] Integration details:', {
        id: integration.id,
        projectId: integration.projectId,
        platform: integration.platform,
        isActive: integration.isActive,
        hasIntegrationKey: !!integration.integrationKey,
        integrationKey: integration.integrationKey ? `${integration.integrationKey.substring(0, 20)}...` : 'none',
        hasCredentials: !!integration.credentials,
        credentialsType: typeof integration.credentials,
        credentialsKeys: integration.credentials ? Object.keys(integration.credentials as any) : [],
        credentialsUrl: integration.credentials ? (integration.credentials as any).url : 'none',
      });
    } else {
      // Check if any integrations exist for this project
      const allIntegrations = await db.integration.findMany({
        where: { projectId },
        select: { id: true, platform: true, isActive: true, projectId: true },
      });
      console.log('[Test Publish] All integrations for project:', JSON.stringify(allIntegrations, null, 2));
      
      // Also check if project exists
      console.log('[Test Publish] Project exists:', !!project);
      if (project) {
        console.log('[Test Publish] Project details:', {
          id: project.id,
          userId: project.userId,
        });
      }
    }
    console.log('[Test Publish] ========================================');

    if (!integration) {
      return successResponse({
        success: false,
        error: 'No WordPress integration found',
        details: {
          hasIntegration: false,
          integrationActive: false,
          hasIntegrationKey: false,
          hasWordPressUrl: false,
          projectId,
        },
      });
    }

    const credentials = {
      ...(integration.credentials as any || {}),
      integration_key: integration.integrationKey || undefined,
    };

    const diagnostics = {
      hasIntegration: true,
      integrationActive: integration.isActive,
      hasIntegrationKey: !!credentials.integration_key,
      hasWordPressUrl: !!credentials.url,
      wordPressUrl: credentials.url,
      integrationKeyLength: credentials.integration_key?.length || 0,
    };

    if (!integration.isActive) {
      return successResponse({
        success: false,
        error: 'Integration is not active',
        details: diagnostics,
      });
    }

    if (!credentials.integration_key) {
      return successResponse({
        success: false,
        error: 'Integration key is missing',
        details: diagnostics,
      });
    }

    if (!credentials.url) {
      return successResponse({
        success: false,
        error: 'WordPress URL is missing',
        details: diagnostics,
      });
    }

    // Test the connection by trying to validate the key
    try {
      const testUrl = `${credentials.url.replace(/\/+$/, '')}/wp-json/rankyak/v1/publish`;
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Integration-Key': credentials.integration_key,
        },
        body: JSON.stringify({
          title: 'Test Post',
          content: '<p>This is a test post from RankYak</p>',
          status: 'draft',
        }),
      });

      const responseText = await testResponse.text();
      
      return successResponse({
        success: testResponse.ok,
        error: testResponse.ok ? undefined : `WordPress API returned ${testResponse.status}`,
        details: {
          ...diagnostics,
          testUrl,
          responseStatus: testResponse.status,
          responseBody: responseText.substring(0, 200), // First 200 chars
        },
      });
    } catch (error: any) {
      return successResponse({
        success: false,
        error: `Failed to connect to WordPress: ${error.message}`,
        details: {
          ...diagnostics,
          connectionError: error.message,
        },
      });
    }
  } catch (error) {
    return handleAPIError(error);
  }
}

