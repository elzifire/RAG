/** Known model display names */
const MODEL_NAMES: Record<string, string> = {
  'deepseek-coder:6.7b': 'DeepSeek Coder 6.7B',
  'gemma4:latest': 'Gemma 4',
  'qwen2.5-coder:7b': 'Qwen 2.5 Coder 7B',
  'glm4:latest': 'GLM 4',
}

export function formatModelName(model: string): string {
  return MODEL_NAMES[model] ?? model
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}
