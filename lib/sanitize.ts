/**
 * Sanitize markdown-rendered HTML before injecting via dangerouslySetInnerHTML.
 *
 * `marked.parse()` returns HTML that can include arbitrary URLs, image
 * payloads, and script-bearing fragments. We run the result through
 * DOMPurify to strip:
 *   - <script> tags
 *   - on* event handlers
 *   - javascript: URLs
 *   - data: URLs (except image/* data — see below)
 *   - any tag not on the allow-list
 *
 * Used in:
 *   - app/agent-console/page.tsx       (markdown editor preview)
 *   - app/portal/client-comments-timeline.tsx (comment render)
 */
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

const ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'ul',
];

const ALLOWED_ATTR = [
  'href',
  'title',
  'target',
  'rel',
  'alt',
  'src',
  'class',
  'id',
];

const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'style'],
};

function fallbackSanitize(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form)\b[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '');
}

/**
 * Render markdown to HTML and sanitize the result.
 * Returns HTML that is safe to feed into dangerouslySetInnerHTML.
 */
export function renderSafeMarkdown(markdown: string): string {
  if (!markdown) return '';
  try {
    // marked v14 with async:false returns string synchronously
    const rawHtml = marked.parse(markdown, { async: false }) as string;
    return sanitizeHtml(rawHtml);
  } catch {
    return fallbackSanitize(markdown);
  }
}

/**
 * Sanitize an already-rendered HTML string.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  try {
    return String(DOMPurify.sanitize(html, PURIFY_CONFIG));
  } catch {
    return fallbackSanitize(html);
  }
}