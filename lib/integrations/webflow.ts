import { BaseIntegration, IntegrationCredentials, PublishResult } from './base';

export class WebflowIntegration extends BaseIntegration {
  platform = 'webflow';

  async testConnection(credentials: IntegrationCredentials): Promise<boolean> {
    this.validateCredentials(credentials, ['siteId', 'accessToken']);

    try {
      const response = await fetch(`https://api.webflow.com/v2/sites/${credentials.siteId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[Webflow] Connection test failed:', error);
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
    this.validateCredentials(credentials, ['siteId', 'accessToken', 'collectionId']);

    try {
      // Convert markdown to HTML
      const htmlContent = this.markdownToHtml(article.content);

      // Create CMS item in Webflow
      const itemData = {
        fieldData: {
          name: article.metaTitle || article.title,
          'post-body': htmlContent,
          'post-summary': article.metaDescription || '',
          slug: this.generateSlug(article.title),
        },
      };

      const response = await fetch(
        `https://api.webflow.com/v2/collections/${credentials.collectionId}/items`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Webflow API error: ${error}`);
      }

      const data = await response.json();

      // Publish the item if status is published
      if (article.status === 'published') {
        await fetch(
          `https://api.webflow.com/v2/collections/${credentials.collectionId}/items/${data.id}/publish`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${credentials.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return {
        success: true,
        url: `${credentials.siteUrl || ''}/${data.fieldData?.slug || ''}`,
        postId: data.id,
      };
    } catch (error: any) {
      console.error('[Webflow] Publish failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to publish to Webflow',
      };
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    let html = markdown;

    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

    html = html.split('\n\n').map((para) => {
      if (para.trim() && !para.match(/^<[h|a|ul|ol]/)) {
        return `<p>${para.trim()}</p>`;
      }
      return para;
    }).join('\n');

    html = html.replace(/\n/g, '<br>');

    return html;
  }
}

