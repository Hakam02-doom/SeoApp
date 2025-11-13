# Scraper API Setup

## What is Scraper API?

Scraper API is a service that helps you scrape websites without getting blocked. It handles:
- IP rotation
- CAPTCHA solving
- JavaScript rendering
- Proxy management

## Setup Instructions

1. **Sign up for Scraper API**
   - Go to [ScraperAPI.com](https://www.scraperapi.com/)
   - Create an account
   - Get your API key from the dashboard

2. **Add to .env file**
   ```env
   SCRAPER_API_KEY="your-scraper-api-key-here"
   ```

3. **Pricing**
   - Free tier: 1,000 requests/month
   - Paid plans start at $49/month for 10,000 requests
   - Check their website for current pricing

## Usage in RankYak

The Scraper API is used for:
- **Website Analysis**: Scraping your website to analyze brand, SEO, and content
- **Competitor Analysis**: Scraping competitor websites
- **Content Extraction**: Getting page content for analysis

## Alternative Options

If you don't want to use Scraper API, you can:
1. Use direct HTTP requests (may get blocked)
2. Use other scraping services (Bright Data, Apify, etc.)
3. Use browser automation (Puppeteer, Playwright) - requires more setup

## Testing

After adding your API key, test it by:
1. Going to `/onboarding`
2. Entering a website URL
3. Running the analysis

If you see errors, check:
- API key is correct
- You have remaining API credits
- The website URL is accessible
