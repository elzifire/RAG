<script setup lang="ts">
const store = useChatStore()
const auth = useAuthStore()
const router = useRouter()
const api = useApi()
const { theme, toggle: toggleTheme } = useTheme()

const deletingId = ref<string | null>(null)
const dbHealthLoading = ref(false)
const dbHealthError = ref<string | null>(null)

interface DbHealthStatus {
  latencyMs: number
  pingOk: boolean
  activeSource: 'primary' | 'fallback' | 'unknown'
}

const dbHealth = ref<DbHealthStatus | null>(null)
let healthTimer: ReturnType<typeof setInterval> | null = null

async function fetchDbHealth() {
  if (auth.user?.role !== 'ADMIN') return

  dbHealthLoading.value = true
  dbHealthError.value = null

  try {
    dbHealth.value = await api.get<DbHealthStatus>('/api/internal/db-connection')
  }
  catch (err: unknown) {
    dbHealthError.value = (err as { data?: { message?: string } }).data?.message
      ?? (err instanceof Error ? err.message : 'Health check failed')
  }
  finally {
    dbHealthLoading.value = false
  }
}

onMounted(() => {
  if (auth.user?.role !== 'ADMIN') return

  fetchDbHealth()
  healthTimer = setInterval(fetchDbHealth, 30_000)
})

onUnmounted(() => {
  if (healthTimer) clearInterval(healthTimer)
})

async function handleNewChat() {
  await store.createSession()
}

async function handleDelete(sessionId: string) {
  deletingId.value = sessionId
  try {
    await store.deleteSession(sessionId)
  }
  finally {
    deletingId.value = null
  }
}

function logout() {
  auth.logout()
  store.clearAll()
  router.replace('/login')
}
</script>

<template>
  <aside class="flex flex-col h-full bg-base-200 border-r border-base-300">

    <!-- ── Brand ───────────────────────────────────────────────── -->
    <div class="flex items-center  gap-3 px-4 py-4 border-b border-base-300 shrink-0">
      <span class="font-bold text-base leading-tight ">RAG Chat</span>
    </div>

    <!-- ── New Chat button ────────────────────────────────────── -->
    <div class="px-3 pt-3 pb-2 shrink-0">
      <button
        class="btn btn-primary btn-sm w-full gap-2 normal-case"
        :disabled="store.isLoadingSessions"
        @click="handleNewChat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>
    </div>

    <!-- ── Model selector ─────────────────────────────────────── -->
    <div class="px-3 pb-2 shrink-0">
      <ChatModelSelector
        v-model="store.activeModel"
        :models="store.models"
        :loading="store.isLoadingModels"
      />
    </div>

    <!-- ── Sessions list ──────────────────────────────────────── -->
    <div class="flex-1 overflow-y-auto px-2 py-1 min-h-0">

      <!-- Loading skeleton -->
      <template v-if="store.isLoadingSessions">
        <div v-for="i in 4" :key="i" class="skeleton h-12 w-full rounded-lg mb-1" />
      </template>

      <!-- Empty sessions -->
      <div
        v-else-if="!store.sessions.length"
        class="flex flex-col items-center justify-center py-10 gap-2 text-center text-base-content/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
        <p class="text-xs">No conversations yet</p>
        <p class="text-xs opacity-60">Click "New Chat" to begin</p>
      </div>

      <!-- Session items -->
      <div
        v-else
        v-for="session in store.sessions"
        :key="session.id"
        role="button"
        tabindex="0"
        class="group w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-base-300 mb-0.5 cursor-pointer select-none"
        :class="{
          'bg-base-300 ring-1 ring-primary/20': session.id === store.activeSessionId,
        }"
        @click="store.setActiveSession(session.id)"
        @keydown.enter.prevent="store.setActiveSession(session.id)"
        @keydown.space.prevent="store.setActiveSession(session.id)"
      >
        <!-- Streaming indicator -->
        <span
          v-if="store.isStreaming(session.id)"
          class="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"
        />
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-3.5 w-3.5 shrink-0 opacity-40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate leading-tight">{{ session.name }}</p>
          <p class="text-xs opacity-40 truncate leading-tight mt-0.5">{{ session.lastMessage || 'No messages' }}</p>
        </div>

        <!-- Delete button -->
        <button
          class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 hover:text-error transition-opacity shrink-0"
          :class="{ 'loading loading-xs': deletingId === session.id }"
          aria-label="Delete conversation"
          @click.stop="handleDelete(session.id)"
        >
          <svg v-if="deletingId !== session.id" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Footer ─────────────────────────────────────────────── -->
    <div class="shrink-0 px-3 py-3 border-t border-base-300 space-y-1">
      <div v-if="auth.user?.role === 'ADMIN'" class="rounded-lg border border-base-content/10 bg-base-content/5 px-3 py-2 mb-1">
        <div class="flex items-center justify-between">
          <p class="text-[10px] uppercase tracking-wide text-base-content/45 font-semibold">App Health</p>
          <button class="btn btn-ghost btn-xs h-5 min-h-0 px-1" :disabled="dbHealthLoading" @click="fetchDbHealth">
            <span v-if="dbHealthLoading" class="loading loading-spinner loading-xs"></span>
            <span v-else>↻</span>
          </button>
        </div>
        <p class="text-[11px] text-base-content/65">
          DB: <span class="font-semibold" :class="dbHealth?.activeSource === 'primary' ? 'text-success' : dbHealth?.activeSource === 'fallback' ? 'text-warning' : 'text-base-content/60'">{{ dbHealth?.activeSource || 'unknown' }}</span>
        </p>
        <p class="text-[11px] text-base-content/65">
          Ping: <span class="font-semibold" :class="dbHealth?.pingOk ? 'text-success' : 'text-error'">{{ dbHealth?.pingOk ? 'ok' : 'failed' }}</span>
          <span class="text-base-content/40">· {{ dbHealth?.latencyMs ?? '-' }} ms</span>
        </p>
        <p v-if="dbHealthError" class="text-[10px] text-error/80 truncate" :title="dbHealthError">{{ dbHealthError }}</p>
      </div>

      <!-- User info -->
      <div v-if="auth.user" class="flex items-center justify-center gap-3 px-3 py-2 mb-1 bg-base-200/50">
        <div class="avatar placeholder">
          <div class="w-9 h-9 rounded-full bg-sky-500/75 text-primary-content text-sm font-semibold">
            <span class="flex items-center justify-center m-2">{{ auth.user.name.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium truncate">{{ auth.user.name }}</p>
          <p class="text-xs opacity-40 truncate">{{ auth.user.email }}</p>
        </div>
        <NuxtLink to="/settings" class="btn btn-ghost btn-xs btn-square" title="Account settings" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </NuxtLink>
      </div>
      <button
        class="btn btn-ghost btn-sm w-full gap-2 normal-case justify-start"
        @click="toggleTheme"
      >
        <!-- Sun -->
        <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <!-- Moon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
      </button>
      <button
        class="btn btn-ghost btn-sm w-full gap-2 normal-case justify-start text-error hover:bg-error/10"
        @click="logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </div>
  </aside>
</template>
