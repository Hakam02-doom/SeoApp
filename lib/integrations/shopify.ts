import { BaseIntegration, IntegrationCredentials, PublishResult } from './base';

export class ShopifyIntegration extends BaseIntegration {
  platform = 'shopify';

  async testConnection(credentials: IntegrationCredentials): Promise<boolean> {
    this.validateCredentials(credentials, ['shop', 'accessToken']);

    try {
      const response = await fetch(
        `https://${credentials.shop}.myshopify.com/admin/api/2024-01/shop.json`,
        {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': credentials.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('[Shopify] Connection test failed:', error);
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
    this.validateCredentials(credentials, ['shop', 'accessToken']);

    try {
      // Convert markdown to HTML
      const htmlContent = this.markdownToHtml(article.content);

      // Create blog post in Shopify
      const blogId = credentials.blogId || await this.getDefaultBlogId(credentials);

      const postData = {
        article: {
          title: article.metaTitle || article.title,
          body_html: htmlContent,
          summary: article.metaDescription || '',
          published: article.status === 'published',
        },
      };

      const response = await fetch(
        `https://${credentials.shop}.myshopify.com/admin/api/2024-01/blogs/${blogId}/articles.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': credentials.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Shopify API error: ${error}`);
      }

      const data = await response.json();
      const articleData = data.article;

      return {
        success: true,
        url: `https://${credentials.shop}/blogs/${articleData.blog_handle}/${articleData.handle}`,
        postId: articleData.id.toString(),
      };
    } catch (error: any) {
      console.error('[Shopify] Publish failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to publish to Shopify',
      };
    }
  }

  private async getDefaultBlogId(credentials: IntegrationCredentials): Promise<string> {
    const response = await fetch(
      `https://${credentials.shop}.myshopify.com/admin/api/2024-01/blogs.json`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': credentials.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get Shopify blogs');
    }

    const data = await response.json();
    return data.blogs[0]?.id?.toString() || '';
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion (same as WordPress)
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

