/**
 * Test script to verify Scraper API is working
 * This can be called from a tRPC endpoint for testing
 */

import { scrapeWebsite } from './website-analyzer';

export async function testScraperAPI(url: string = 'https://example.com'): Promise<{
  success: boolean;
  message: string;
  htmlLength?: number;
}> {
  try {
    const html = await scrapeWebsite(url);
    return {
      success: true,
      message: 'Scraper API is working correctly',
      htmlLength: html.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
