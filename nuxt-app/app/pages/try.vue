<template>
  <div class="min-h-screen bg-base-100 overflow-x-hidden relative" data-theme="night">

    <!-- ─── AMBIENT BG ─── -->
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="absolute inset-0 bg-grid opacity-10"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <PublicsiteTheNavbar />

    <main class="relative z-10 max-w-xl mx-auto px-4 pt-24 pb-20">

      <!-- ─── PAGE HEADER ─── -->
      <header class="text-center mb-7">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/8 text-primary text-[11px] font-medium mb-5 tracking-wide">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
          Demo Gratis · {{ status?.remaining ?? '?' }} pesan tersisa
        </div>
        <h1 class="font-display font-black text-3xl md:text-4xl text-base-content leading-tight mb-2 tracking-tight">
          Coba RAGChat <span class="text-gradient">sekarang</span>
        </h1>
        <p class="text-sm text-base-content/35 leading-relaxed">
          Tidak perlu daftar. Ajukan pertanyaan apapun — dijawab AI.
        </p>
      </header>

      <!-- ─── ACCESS TOKEN ─── -->
      <div class="mb-4 flex justify-end">
        <button
          class="text-[11px] text-base-content/25 hover:text-primary/60 transition-colors underline underline-offset-2"
          @click="showTokenInput = !showTokenInput"
        >
          {{ accessToken ? '🔑 Token aktif — ganti?' : 'Punya access token?' }}
        </button>
      </div>

      <Transition name="slide-fade">
        <div v-if="showTokenInput" class="mb-4 flex gap-2">
          <label class="input input-sm flex-1 flex items-center gap-2 rounded-xl border-base-content border-opacity-10 bg-base-200 bg-opacity-50 focus-within:border-primary/30">
            <svg class="w-3.5 h-3.5 text-base-content/25 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
            <input
              v-model="accessToken"
              type="text"
              placeholder="Tempel token di sini…"
              class="grow bg-transparent text-xs font-mono focus:outline-none placeholder:text-base-content opacity-20"
              @keydown.enter.prevent="applyToken"
            />
          </label>
          <button class="btn btn-primary btn-sm rounded-xl" @click="applyToken">Terapkan</button>
          <button class="btn btn-ghost btn-sm rounded-xl border border-base-content/8" @click="accessToken = ''; applyToken()">Hapus</button>
        </div>
      </Transition>

      <!-- ─── EXHAUSTED BANNER ─── -->
      <Transition name="slide-fade">
        <div v-if="exhausted" class="rounded-2xl border border-warning/15 bg-warning/6 p-6 mb-5 text-center">
          <p class="text-2xl mb-2">🎉</p>
          <p class="font-display font-bold text-base text-base-content mb-1">Batas demo tercapai!</p>
          <p class="text-sm text-base-content/40 mb-5 leading-relaxed max-w-xs mx-auto">
            Daftar gratis untuk chat tanpa batas & akses Knowledge Base pribadi.
          </p>
          <div class="flex justify-center gap-2">
            <NuxtLink to="/login" class="btn btn-primary btn-sm rounded-xl shadow-lg shadow-primary/20 gap-2">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Daftar Gratis
            </NuxtLink>
            <NuxtLink to="/publicsite/pricing" class="btn btn-ghost btn-sm rounded-xl border border-base-content border-opacity-10">
              Lihat Harga
            </NuxtLink>
          </div>
        </div>
      </Transition>

      <SweetAlert
        v-model="showExhaustedAlert"
        variant="warning"
        title="Batas Demo Tercapai"
        subtitle="Fallback User Mode"
        message="Kamu sudah mencapai limit chat demo. Lanjut daftar gratis untuk akses lebih panjang dan fitur penuh."
        confirm-text="Daftar Gratis"
        cancel-text="Nanti Dulu"
        @confirm="goRegister"
      />

      <!-- ─── CHAT CARD ─── -->
      <div class="rounded-2xl border border-base-content/8 bg-base-200/35 backdrop-blur-md overflow-hidden shadow-xl shadow-black/20">

        <!-- Titlebar -->
        <div class="flex items-center gap-2 px-4 py-3 border-b border-base-content/6 bg-base-200 bg-opacity-50">
          <span class="w-2.5 h-2.5 rounded-full bg-error/50"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-warning/50"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-success/50"></span>
          <span class="ml-2 text-[11px] text-base-content opacity-20 font-medium tracking-wide">RAGChat Demo</span>
          <div class="ml-auto flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            <span class="text-[10px] text-base-content opacity-20">Live</span>
          </div>
        </div>

        <!-- Messages area -->
        <div
          ref="scrollEl"
          class="flex flex-col gap-3 p-4 min-h-[320px] max-h-[400px] overflow-y-auto scrollbar-none"
        >

          <!-- Welcome bubble -->
          <div class="flex gap-2.5 items-start">
            <div class="ai-avatar shrink-0 mt-0.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
              </svg>
            </div>
            <div class="max-w-[82%]">
              <p class="sender-label">RAGChat AI</p>
              <div class="bubble-ai">
                Halo! Ini adalah mode demo — kamu punya
                <strong class="text-primary font-semibold">{{ status?.limit ?? '?' }} pesan</strong>
                untuk dicoba. Silakan tanya apa saja! 👋
              </div>
            </div>
          </div>

          <!-- History -->
          <template v-for="(msg, i) in history" :key="i">
            <div class="flex gap-2.5 items-start" :class="msg.role === 'user' ? 'flex-row-reverse' : ''">

              <!-- Avatar -->
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                :class="msg.role === 'user' ? 'user-avatar' : 'ai-avatar'"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path v-if="msg.role === 'user'" stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
              </div>

              <!-- Bubble -->
              <div class="max-w-[82%]">
                <p class="sender-label" :class="msg.role === 'user' ? 'text-right' : ''">
                  {{ msg.role === 'user' ? 'Kamu' : 'RAGChat AI' }}
                </p>
                <div
                  class="anim-msg whitespace-pre-wrap"
                  :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'"
                >{{ msg.content }}</div>
              </div>
            </div>
          </template>

          <!-- Typing indicator -->
          <Transition name="fade">
            <div v-if="loading" class="flex gap-2.5 items-start">
              <div class="ai-avatar shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
              </div>
              <div class="bubble-ai inline-flex py-3">
                <div class="typing-dots flex gap-1 items-center">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </Transition>

        </div>

        <!-- Progress bar -->
        <div class="px-4 pt-2 pb-1.5 border-t border-base-content/5">
          <div class="flex items-center justify-between text-[10px] text-base-content opacity-20 mb-1.5">
            <span>Pesan digunakan</span>
            <span>{{ status?.count ?? 0 }} / {{ status?.limit ?? '?' }}</span>
          </div>
          <div class="w-full h-0.5 bg-base-content/8 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="exhausted ? 'bg-error/50' : 'bg-primary/50'"
              :style="`width:${progressPct}%`"
            ></div>
          </div>
        </div>

        <!-- Error message -->
        <Transition name="fade">
          <div v-if="error" class="px-4 py-2 text-xs text-error flex items-center gap-2">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ error }}
          </div>
        </Transition>

        <!-- Input area -->
        <div class="px-3 pb-3 pt-1.5">
          <div class="flex gap-2 items-end bg-base-300/40 rounded-xl p-1.5 border border-base-content/8 focus-within:border-primary/25 transition-colors">
            <textarea
              ref="textareaEl"
              v-model="input"
              placeholder="Ketik pesan kamu…"
              rows="1"
              class="flex-1 bg-transparent text-sm text-base-content/80 placeholder:text-base-content opacity-20 resize-none leading-relaxed min-h-[36px] max-h-[120px] overflow-y-auto focus:outline-none px-2 py-1.5"
              :disabled="loading || exhausted"
              @keydown.enter.exact.prevent="send"
              @input="autoResize"
            ></textarea>
            <button
              class="btn btn-primary btn-sm w-9 h-9 min-h-0 p-0 rounded-lg shrink-0 self-end transition-all"
              :disabled="!input.trim() || loading || exhausted"
              @click="send"
            >
              <span v-if="loading" class="loading loading-spinner loading-xs"></span>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
          <p class="text-[10px] text-base-content/18 mt-1.5 px-1">
            Enter untuk kirim · Mode demo — tanpa knowledge base pribadi
          </p>
        </div>

      </div>
      <!-- /chat card -->

      <!-- ─── SOFT CTA (after first message) ─── -->
      <Transition name="fade">
        <div v-if="!exhausted && (status?.count ?? 0) > 0" class="mt-6 text-center">
          <p class="text-xs text-base-content/25 mb-3">Ingin akses penuh dengan knowledge base pribadi?</p>
          <NuxtLink
            to="/login"
            class="btn btn-ghost btn-sm rounded-xl border border-base-content border-opacity-10 hover:border-primary/25 gap-2 text-base-content/50 hover:text-base-content/80"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Daftar Gratis
          </NuxtLink>
        </div>
      </Transition>

    </main>

    <PublicsiteTheFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { $fetch } from 'ofetch'
import { useRouter } from 'vue-router'
import { useUiToast } from '../composables/useUiToast'

const router = useRouter()

const input = ref('')
const loading = ref(false)
const error = ref('')
const scrollEl = ref<HTMLElement>()
const textareaEl = ref<HTMLTextAreaElement>()
const showTokenInput = ref(false)
const accessToken = ref('')
const showExhaustedAlert = ref(false)
const hasShownExhaustedAlert = ref(false)
const toast = useUiToast()

interface GuestStatus { count: number; limit: number; remaining: number; exhausted: boolean; enabled: boolean; mode?: string }
interface HistoryItem { role: 'user' | 'assistant'; content: string }

const status = ref<GuestStatus | null>(null)
const history = ref<HistoryItem[]>([])

const exhausted = computed(() => status.value?.exhausted ?? false)
const progressPct = computed(() => {
  const count = status.value?.count ?? 0
  const limit = status.value?.limit ?? 0
  if (!limit) return 0
  return Math.min(100, Math.round((count / limit) * 100))
})

/** Build request headers — include X-Access-Token when token is set. */
function chatHeaders(): Record<string, string> {
  const t = accessToken.value.trim()
  return t ? { 'x-access-token': t } : {}
}

async function fetchStatus() {
  try {
    status.value = await $fetch<GuestStatus>('/api/guest/session', { headers: chatHeaders() })
  }
  catch {
    toast.warning('Status demo belum bisa dimuat. Coba refresh sebentar lagi.', 'Koneksi Demo')
  }
}

async function applyToken() {
  showTokenInput.value = false
  // Persist to localStorage so it survives page reload
  if (typeof localStorage !== 'undefined') {
    if (accessToken.value.trim()) localStorage.setItem('ragchat_access_token', accessToken.value.trim())
    else localStorage.removeItem('ragchat_access_token')
  }
  await fetchStatus()

  if (accessToken.value.trim()) {
    toast.success('Access token diterapkan. Limit demo mengikuti token aktif.', 'Token Aktif')
  }
  else {
    toast.info('Token dihapus. Kembali ke mode demo normal.', 'Mode Demo')
  }
}

async function send() {
  const msg = input.value.trim()
  if (!msg || loading.value || exhausted.value) return

  error.value = ''
  input.value = ''
  autoResize()

  history.value.push({ role: 'user', content: msg })
  loading.value = true
  await scrollBottom()

  try {
    const res = await $fetch<{ reply: string; count: number; remaining: number; exhausted: boolean }>('/api/guest/chat', {
      method: 'POST',
      headers: chatHeaders(),
      body: {
        message: msg,
        history: history.value.slice(-8).map(h => ({ role: h.role, content: h.content })),
      },
    })
    history.value.push({ role: 'assistant', content: res.reply })
    status.value = {
      ...status.value!,
      count: res.count,
      remaining: res.remaining,
      exhausted: res.exhausted,
    }
  }
  catch (err: unknown) {
    const errMsg = (err as { data?: { message?: string } }).data?.message ?? 'Gagal menghubungi AI'
    error.value = errMsg
    toast.error(errMsg, 'Permintaan Gagal')
    history.value.pop()
    await fetchStatus()
  }
  finally {
    loading.value = false
    await scrollBottom()
  }
}

async function scrollBottom() {
  await nextTick()
  if (scrollEl.value) {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }
}

function autoResize() {
  if (!textareaEl.value) return
  textareaEl.value.style.height = 'auto'
  textareaEl.value.style.height = `${textareaEl.value.scrollHeight}px`
}

function goRegister() {
  router.push('/login')
}

watch(exhausted, (value) => {
  if (value && !hasShownExhaustedAlert.value) {
    hasShownExhaustedAlert.value = true
    showExhaustedAlert.value = true
  }
})

onMounted(() => {
  // Restore token from localStorage
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('ragchat_access_token')
    if (saved) accessToken.value = saved
  }
  fetchStatus()
})
</script>

<style scoped>
/* ─── Typography ─── */
.font-display { font-family: 'Syne', sans-serif; }

/* ─── Background grid ─── */
.bg-grid {
  background-image:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 56px 56px;
}

/* ─── Ambient orbs ─── */
.orb { position: absolute; border-radius: 9999px; filter: blur(110px); pointer-events: none; }
.orb-1 {
  width: 480px; height: 480px;
  background: oklch(var(--p) / 0.08);
  top: -120px; right: -100px;
  animation: orb-drift 20s ease-in-out infinite alternate;
}
.orb-2 {
  width: 320px; height: 320px;
  background: oklch(var(--s) / 0.07);
  bottom: 160px; left: -80px;
  animation: orb-drift 26s ease-in-out infinite alternate-reverse;
}
@keyframes orb-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(20px, 18px) scale(1.04); }
}

/* ─── Gradient text ─── */
.text-gradient {
  background: linear-gradient(135deg, oklch(var(--p)) 0%, oklch(var(--s)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ─── Avatars ─── */
.ai-avatar {
  @apply w-7 h-7 rounded-full flex items-center justify-center;
  background: linear-gradient(135deg, oklch(var(--p)) 0%, oklch(var(--p) / 0.6) 100%);
  color: oklch(var(--pc));
}
.user-avatar {
  @apply w-7 h-7 rounded-full flex items-center justify-center;
  background: linear-gradient(135deg, oklch(var(--s)) 0%, oklch(var(--s) / 0.6) 100%);
  color: oklch(var(--sc));
}

/* ─── Chat bubbles ─── */
.bubble-ai {
  @apply px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl rounded-tl-sm;
  background: oklch(var(--b3) / 0.7);
  color: oklch(var(--bc) / 0.75);
}
.bubble-user {
  @apply px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl rounded-tr-sm ml-auto;
  background: oklch(var(--p) / 0.18);
  color: oklch(var(--bc) / 0.82);
}

/* ─── Sender label ─── */
.sender-label {
  @apply text-[10px] text-base-content opacity-20 mb-1;
}

/* ─── Message animation ─── */
.anim-msg { animation: msg-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
@keyframes msg-in {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ─── Typing dots ─── */
.typing-dots span {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 9999px;
  background: oklch(var(--bc) / 0.3);
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.18s; }
.typing-dots span:nth-child(3) { animation-delay: 0.36s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); background: oklch(var(--p) / 0.65); }
}

/* ─── Scrollbar ─── */
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

/* ─── Transitions ─── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-fade-enter-active { transition: all 0.22s ease; }
.slide-fade-leave-active { transition: all 0.18s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(-6px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>