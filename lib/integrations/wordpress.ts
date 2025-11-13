import { BaseIntegration, IntegrationCredentials, PublishResult } from './base';

export class WordPressIntegration extends BaseIntegration {
  platform = 'wordpress';

  async testConnection(credentials: IntegrationCredentials): Promise<boolean> {
    try {
      // Check if using integration key (preferred method)
      if (credentials.integration_key) {
        const response = await fetch(`${credentials.url}/wp-json/rankyak/v1/test`, {
          method: 'GET',
          headers: {
            'X-Integration-Key': credentials.integration_key,
            'Content-Type': 'application/json',
          },
        });

        return response.ok;
      }

      // Check if using OAuth (plugin method)
      if (credentials.access_token) {
        // Test using plugin REST API endpoint
        const response = await fetch(`${credentials.url}/wp-json/rankyak/v1/test`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        return response.ok;
      }

      // Fall back to basic auth (REST API method)
      this.validateCredentials(credentials, ['url', 'username', 'password']);

      const response = await fetch(`${credentials.url}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[WordPress] Connection test failed:', error);
      return false;
    }
  }

  async publish(
    credentials: IntegrationCredentials,
    article: {
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      featuredImage?: string;
      status?: string;
    }
  ): Promise<PublishResult> {
    try {
      // Check if using integration key (preferred method)
      if (credentials.integration_key) {
        return await this.publishViaPlugin(credentials, article, true);
      }

      // Check if using OAuth (plugin method)
      if (credentials.access_token) {
        return await this.publishViaPlugin(credentials, article, false);
      }

      // Fall back to basic auth (REST API method)
      this.validateCredentials(credentials, ['url', 'username', 'password']);
      return await this.publishViaREST(credentials, article);
    } catch (error: any) {
      console.error('[WordPress] Publish failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to publish to WordPress',
      };
    }
  }

  /**
   * Publish via WordPress plugin REST API (OAuth or Integration Key)
   */
  private async publishViaPlugin(
    credentials: IntegrationCredentials,
    article: {
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      featuredImage?: string;
      status?: string;
    },
    useIntegrationKey: boolean = false
  ): Promise<PublishResult> {
    // Normalize WordPress URL (remove trailing slash)
    const baseUrl = credentials.url?.replace(/\/+$/, '');
    if (!baseUrl) {
      throw new Error('WordPress URL is required');
    }

    // Convert markdown to HTML
    const htmlContent = this.markdownToHtml(article.content);

    // Prepare WordPress post data for plugin endpoint
    const postData: any = {
      title: article.metaTitle || article.title,
      content: htmlContent,
      status: article.status === 'published' ? 'publish' : 'draft',
      excerpt: article.metaDescription || '',
    };

    if (article.metaTitle) {
      postData.meta_title = article.metaTitle;
    }

    if (article.metaDescription) {
      postData.meta_description = article.metaDescription;
    }

    if (article.featuredImage) {
      postData.featured_image_url = article.featuredImage;
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useIntegrationKey && credentials.integration_key) {
      // Use integration key for authentication
      headers['X-Integration-Key'] = credentials.integration_key;
      console.log('[WordPress] Publishing with integration key:', {
        url: `${baseUrl}/wp-json/rankyak/v1/publish`,
        hasKey: !!credentials.integration_key,
        keyLength: credentials.integration_key?.length,
      });
    } else {
      // Use OAuth token
      let accessToken = credentials.access_token;
      if (credentials.expires_at) {
        const expiresAt = new Date(credentials.expires_at);
        if (expiresAt < new Date()) {
          // Token expired, try to refresh
          if (credentials.refresh_token) {
            const refreshed = await this.refreshToken(credentials);
            if (refreshed) {
              accessToken = refreshed.access_token;
            } else {
              throw new Error('Access token expired and refresh failed');
            }
          } else {
            throw new Error('Access token expired');
          }
        }
      }
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const publishUrl = `${baseUrl}/wp-json/rankyak/v1/publish`;
    console.log('[WordPress] Publishing to:', publishUrl);

    try {
      const response = await fetch(publishUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(postData),
      });

      const responseText = await response.text();
      console.log('[WordPress] Response status:', response.status);
      console.log('[WordPress] Response body:', responseText);

      if (!response.ok) {
        let errorMessage = `WordPress plugin API error (${response.status}): ${responseText}`;
        try {
          const errorJson = JSON.parse(responseText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch {
          // Use text as-is if not JSON
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);

      return {
        success: true,
        url: result.url || result.link,
        postId: result.post_id?.toString() || result.id?.toString(),
      };
    } catch (error: any) {
      console.error('[WordPress] Fetch error:', error);
      if (error.message) {
        throw error;
      }
      throw new Error(`Failed to connect to WordPress: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Publish via WordPress REST API (Basic Auth)
   */
  private async publishViaREST(
    credentials: IntegrationCredentials,
    article: {
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      featuredImage?: string;
      status?: string;
    }
  ): Promise<PublishResult> {
    // Convert markdown to HTML
    const htmlContent = this.markdownToHtml(article.content);

    // Prepare WordPress post data
    const postData: any = {
      title: article.metaTitle || article.title,
      content: htmlContent,
      status: article.status === 'published' ? 'publish' : 'draft',
      excerpt: article.metaDescription || '',
    };

    // Add featured image if provided
    if (article.featuredImage) {
      // WordPress requires media ID, not URL
      // For now, we'll skip featured image or implement media upload separately
    }

    const response = await fetch(`${credentials.url}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${error}`);
    }

    const post = await response.json();

    return {
      success: true,
      url: post.link,
      postId: post.id.toString(),
    };
  }

  /**
   * Refresh OAuth access token
   */
  private async refreshToken(credentials: IntegrationCredentials): Promise<{ access_token: string; refresh_token?: string } | null> {
    if (!credentials.refresh_token) {
      return null;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/integrations/wordpress/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      console.error('[WordPress] Token refresh failed:', error);
      return null;
    }
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    // Paragraphs
    html = html.split('\n\n').map((para) => {
      if (para.trim() && !para.match(/^<[h|a|ul|ol]/)) {
        return `<p>${para.trim()}</p>`;
      }
      return para;
    }).join('\n');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }
}

