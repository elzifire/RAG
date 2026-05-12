/**
 * Theme toggle composable.
 * Persists preference in localStorage and syncs the DaisyUI `data-theme` attribute.
 */
export type Theme = 'light' | 'dark'

export const useTheme = () => {
  const theme = useState<Theme>('ui-theme', () => 'dark')

  function applyTheme(t: Theme) {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t)
      localStorage.setItem('chat-theme', t)
    }
  }

  function init() {
    if (import.meta.client) {
      const saved = localStorage.getItem('chat-theme') as Theme | null
      theme.value = saved ?? 'dark'
      applyTheme(theme.value)
    }
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    applyTheme(theme.value)
  }

  return { theme, init, toggle }
}
