import DOMPurify from 'dompurify'

export default defineNuxtPlugin(() => {
  // Expose DOMPurify globally so useMarkdown can reference it lazily
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).__DOMPurify = DOMPurify
})
