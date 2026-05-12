/**
 * Markdown renderer with client-side DOMPurify sanitization.
 * Prevents XSS (OWASP A03) when displaying LLM-generated content via v-html.
 */
import { marked } from 'marked'

marked.use({ breaks: true, gfm: true })

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'del', 's', 'code', 'pre',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div', 'hr',
]

const ALLOWED_ATTR = ['href', 'class', 'target', 'rel']

export const useMarkdown = () => {
  const render = (content: string): string => {
    if (!content) return ''

    const rawHtml = marked.parse(content) as string

    // Sanitize only on client (DOMPurify requires DOM)
    if (import.meta.client) {
      // Lazy-load DOMPurify so it never runs on the server
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const purify = (globalThis as any).__DOMPurify
      if (purify) {
        return purify.sanitize(rawHtml, {
          ALLOWED_TAGS,
          ALLOWED_ATTR,
          FORCE_BODY: false,
        })
      }
    }

    // SSR / DOMPurify not ready: strip all HTML tags as a safe fallback
    return rawHtml.replace(/<[^>]*>/g, '')
  }

  return { render }
}
