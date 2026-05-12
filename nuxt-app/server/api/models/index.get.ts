import { getOpenAIModelFallbacks } from '../../utils/llm'

export default defineEventHandler(async () => {
  try {
    return await fetchOllamaModels()
  }
  catch (err: unknown) {
    const openaiFallback = getOpenAIModelFallbacks()
    if (openaiFallback.length) return openaiFallback

    const msg = err instanceof Error ? err.message : 'Failed to fetch models'
    throw createError({ statusCode: 502, message: msg })
  }
})
