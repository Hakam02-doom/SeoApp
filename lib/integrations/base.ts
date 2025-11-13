/**
 * Base integration interface and utilities
 */

export interface IntegrationCredentials {
  [key: string]: any;
}

export interface PublishResult {
  success: boolean;
  url?: string;
  postId?: string;
  error?: string;
}

export interface Integration {
  platform: string;
  testConnection(credentials: IntegrationCredentials): Promise<boolean>;
  publish(
    credentials: IntegrationCredentials,
    article: {
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      featuredImage?: string;
      status?: string;
    }
  ): Promise<PublishResult>;
}

export abstract class BaseIntegration implements Integration {
  abstract platform: string;

  abstract testConnection(credentials: IntegrationCredentials): Promise<boolean>;
  abstract publish(
    credentials: IntegrationCredentials,
    article: {
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      featuredImage?: string;
      status?: string;
    }
  ): Promise<PublishResult>;

  protected validateCredentials(
    credentials: IntegrationCredentials,
    requiredFields: string[]
  ): void {
    const missing = requiredFields.filter((field) => !credentials[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required credentials: ${missing.join(', ')}`);
    }
  }
}

