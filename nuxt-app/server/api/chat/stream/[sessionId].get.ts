import { createEventStream } from 'h3'
import { dequeueChatJob, completeChatJob, failChatJob } from '../../../utils/chatQueue'
import { streamChatCompletion, type ChatCompletionMessage } from '../../../utils/llm'

async function resolveSkipQueueJob(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { id: true, model: true },
  })

  if (!session) return null

  const latestAssistant = await prisma.message.findFirst({
    where: { sessionId, role: 'assistant' },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })

  const pendingUser = await prisma.message.findFirst({
    where: {
      sessionId,
      role: 'user',
      ...(latestAssistant ? { createdAt: { gt: latestAssistant.createdAt } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, createdAt: true },
  })

  if (!pendingUser) return null

  return {
    queueJobId: pendingUser.id,
    sessionId,
    model: session.model,
    userMessageId: pendingUser.id,
    timestamp: pendingUser.createdAt.toISOString(),
    source: 'skipped' as const,
  }
}

export default defineEventHandler(async (event) => {
  const sessionId = getRouterParam(event, 'sessionId')
  if (!sessionId) throw createError({ statusCode: 400, message: 'Session ID required' })

  const eventStream = createEventStream(event)

  // Process asynchronously so the response is returned immediately
  ;(async () => {
    let job: Awaited<ReturnType<typeof dequeueChatJob>> = null

    try {
      // Dequeue job with priority: Redis -> DB queue -> skip queue.
      job = await dequeueChatJob(sessionId)
      if (!job) {
        job = await resolveSkipQueueJob(sessionId)
      }

      if (!job) {
        await eventStream.push({
          event: 'error',
          data: JSON.stringify({ message: 'No pending messages to process' }),
        })
        return
      }

      // Build conversation history from PostgreSQL (last 40 messages for context window)
      const dbMessages = await prisma.message.findMany({
        select: { role: true, content: true },
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: 40,
      })

      const history: ChatCompletionMessage[] = dbMessages.map(m => ({
        role: m.role.toLowerCase() as ChatCompletionMessage['role'],
        content: m.content,
      }))

      let fullContent = ''
      let assistantDbId: string | undefined
      let usedProvider: 'ollama' | 'openai' = 'ollama'
      let usedModel = job.model

      // Authenticated chat keeps Ollama as primary, then OpenAI fallback.
      for await (const chunk of streamChatCompletion({
        model: job.model,
        messages: history,
        priority: 'ollama-first',
      })) {
        usedProvider = chunk.provider
        usedModel = chunk.model

        if (chunk.done) {
          // Persist completed assistant message to PostgreSQL
          const assistantMsg = await prisma.message.create({
            data: {
              sessionId,
              role: 'assistant',
              content: fullContent,
              model: usedModel,
            },
            select: { id: true },
          })
          assistantDbId = assistantMsg.id

          // Update session updatedAt
          await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          })

          await eventStream.push({
            event: 'done',
            data: JSON.stringify({ messageId: assistantDbId, sessionId, provider: usedProvider }),
          })

          await completeChatJob(job.queueJobId, job.source)
        }
        else if (chunk.content) {
          fullContent += chunk.content
          await eventStream.push({
            event: 'chunk',
            data: JSON.stringify({ content: chunk.content }),
          })
        }
      }
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Stream processing error'
      console.error('[stream] Error:', message)
      if (job) {
        await failChatJob(job.queueJobId, message, job.source)
      }
      await eventStream.push({
        event: 'error',
        data: JSON.stringify({ message }),
      })
    }
    finally {
      await eventStream.close()
    }
  })()

  return eventStream.send()
})
