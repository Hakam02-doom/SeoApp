export interface SEOAnalysis {
  score: number; // 0-100
  wordCount: number;
  headingCount: number;
  paragraphCount: number;
  internalLinks: number;
  externalLinks: number;
  keywordDensity: number; // percentage
  issues: SEOIssue[];
  suggestions: string[];
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export function analyzeSEO(
  content: string,
  metaTitle: string,
  metaDescription: string,
  targetKeyword: string
): SEOAnalysis {
  const issues: SEOIssue[] = [];
  const suggestions: string[] = [];

  // Word count
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

  // Heading analysis
  const h1Matches = content.match(/^#\s+.+$/gm) || [];
  const h2Matches = content.match(/^##\s+.+$/gm) || [];
  const h3Matches = content.match(/^###\s+.+$/gm) || [];
  const headingCount = h1Matches.length + h2Matches.length + h3Matches.length;

  if (h1Matches.length === 0) {
    issues.push({
      type: 'error',
      message: 'Article is missing an H1 heading',
      field: 'content',
    });
  } else if (h1Matches.length > 1) {
    issues.push({
      type: 'warning',
      message: 'Article has multiple H1 headings. Use only one H1 per page.',
      field: 'content',
    });
  }

  if (h2Matches.length < 2) {
    suggestions.push('Consider adding more H2 headings to improve structure');
  }

  // Paragraph count
  const paragraphCount = content.split(/\n\n/).filter((p) => p.trim().length > 0).length;

  // Link analysis
  const internalLinkPattern = /\[([^\]]+)\]\((\/[^\)]+)\)/g;
  const externalLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  const internalLinks = (content.match(internalLinkPattern) || []).length;
  const externalLinks = (content.match(externalLinkPattern) || []).length;

  if (internalLinks === 0 && wordCount > 500) {
    suggestions.push('Consider adding internal links to related articles');
  }

  // Keyword density
  const keywordLower = targetKeyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const keywordMatches = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
  const keywordDensity = wordCount > 0 ? (keywordMatches / wordCount) * 100 : 0;

  if (keywordDensity < 0.5) {
    issues.push({
      type: 'warning',
      message: 'Keyword density is low. Consider using the target keyword more naturally.',
      field: 'content',
    });
  } else if (keywordDensity > 3) {
    issues.push({
      type: 'warning',
      message: 'Keyword density is high. Avoid keyword stuffing.',
      field: 'content',
    });
  }

  // Meta title analysis
  if (metaTitle.length === 0) {
    issues.push({
      type: 'error',
      message: 'Meta title is required',
      field: 'metaTitle',
    });
  } else if (metaTitle.length < 30) {
    suggestions.push('Meta title could be longer (aim for 50-60 characters)');
  } else if (metaTitle.length > 60) {
    issues.push({
      type: 'warning',
      message: 'Meta title is too long (may be truncated in search results)',
      field: 'metaTitle',
    });
  }

  if (!metaTitle.toLowerCase().includes(keywordLower)) {
    suggestions.push('Consider including the target keyword in the meta title');
  }

  // Meta description analysis
  if (metaDescription.length === 0) {
    issues.push({
      type: 'error',
      message: 'Meta description is required',
      field: 'metaDescription',
    });
  } else if (metaDescription.length < 120) {
    suggestions.push('Meta description could be longer (aim for 150-160 characters)');
  } else if (metaDescription.length > 160) {
    issues.push({
      type: 'warning',
      message: 'Meta description is too long (may be truncated in search results)',
      field: 'metaDescription',
    });
  }

  // Calculate SEO score
  let score = 100;

  // Deduct points for errors
  score -= issues.filter((i) => i.type === 'error').length * 10;
  score -= issues.filter((i) => i.type === 'warning').length * 5;

  // Deduct for missing elements
  if (wordCount < 300) score -= 10;
  if (headingCount < 2) score -= 5;
  if (internalLinks === 0 && wordCount > 1000) score -= 5;
  if (keywordDensity < 0.5 || keywordDensity > 3) score -= 5;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    wordCount,
    headingCount,
    paragraphCount,
    internalLinks,
    externalLinks,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    issues,
    suggestions,
  };
}
