<template>
  <div class="ui-admin-page md:p-8 font-sans">

    <!-- ─── PAGE HEADER ─── -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <div>
          <h1 class="font-display font-extrabold text-xl text-base-content tracking-tight">Pengaturan Aplikasi</h1>
          <p class="text-xs text-base-content/40 mt-0.5">Konfigurasi global RAGChat</p>
        </div>
      </div>

      <!-- Save button top (desktop) -->
      <div class="hidden sm:flex items-center gap-3">
        <Transition name="fade">
          <div v-if="saveSuccess" class="flex items-center gap-1.5 text-xs text-success font-medium">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Disimpan
          </div>
        </Transition>
        <Transition name="fade">
          <div v-if="saveError" class="flex items-center gap-1.5 text-xs text-error font-medium">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            {{ saveError }}
          </div>
        </Transition>
        <button
          class="btn btn-primary btn-sm gap-2 shadow-md shadow-primary/20 rounded-xl px-5"
          :disabled="saving"
          @click="saveAll"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs"></span>
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Simpan Pengaturan
        </button>
      </div>
    </div>

    <!-- ─── SETTINGS LAYOUT ─── -->
    <div class="flex flex-col gap-4 max-w-3xl">

      <!-- ══════════════════════════════════
           SECTION 1: GUEST CHAT
      ══════════════════════════════════ -->
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 overflow-hidden">

        <!-- Section header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-base-content/6">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
              <svg class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-base-content">Guest Chat</p>
              <p class="text-xs text-base-content/35">Atur akses chat untuk pengguna tanpa akun</p>
            </div>
          </div>
          <!-- inline enabled toggle on header -->
          <input
            type="checkbox"
            class="toggle toggle-accent toggle-sm"
            :checked="form.guest_enabled === 'true'"
            @change="onGuestToggle"
          />
        </div>

        <!-- Section body -->
        <div class="px-6 py-5 flex flex-col gap-0 divide-y divide-base-content/5">

          <!-- Row: guest enabled description -->
          <div class="flex items-start justify-between gap-6 py-4 first:pt-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content/80">Izinkan Chat Tanpa Login</p>
              <p class="text-xs text-base-content/35 mt-0.5 leading-relaxed">
                Pengguna yang belum mendaftar dapat menggunakan chat dalam batas tertentu.
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0 pt-0.5">
              <span class="text-xs font-medium" :class="form.guest_enabled === 'true' ? 'text-success' : 'text-base-content/30'">
                {{ form.guest_enabled === 'true' ? 'Aktif' : 'Nonaktif' }}
              </span>
            </div>
          </div>

          <!-- Row: max messages -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content/80">Maks. Pesan per Sesi</p>
              <p class="text-xs text-base-content/35 mt-0.5 leading-relaxed">
                Jumlah maksimum pesan yang dapat dikirim guest sebelum diminta mendaftar.
              </p>
            </div>
            <div class="sm:w-36 shrink-0">
              <label class="input input-sm flex items-center gap-2 rounded-xl border-base-content/10 bg-base-100/50 focus-within:border-primary/40">
                <svg class="w-3.5 h-3.5 text-base-content/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
                <input
                  v-model="form.guest_max_messages"
                  type="number"
                  min="1"
                  max="100"
                  class="grow bg-transparent text-sm focus:outline-none w-0"
                  placeholder="5"
                />
                <span class="text-xs text-base-content/25 shrink-0">pesan</span>
              </label>
            </div>
          </div>

          <!-- Row: default model -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 last:pb-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content/80">Model Default Guest</p>
              <p class="text-xs text-base-content/35 mt-0.5 leading-relaxed">
                Model Ollama yang digunakan untuk sesi guest. Pastikan model sudah ter-pull.
              </p>
            </div>
            <div class="sm:w-44 shrink-0">
              <label class="input input-sm flex items-center gap-2 rounded-xl border-base-content/10 bg-base-100/50 focus-within:border-primary/40">
                <svg class="w-3.5 h-3.5 text-base-content/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
                <input
                  v-model="form.guest_default_model"
                  type="text"
                  class="grow bg-transparent text-sm focus:outline-none w-0"
                  placeholder="llama3.2"
                />
              </label>
            </div>
          </div>

        </div>
      </div>

      <!-- ══════════════════════════════════
           SECTION 2: RATE LIMITING
      ══════════════════════════════════ -->
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 overflow-hidden">

        <div class="flex items-center justify-between px-6 py-4 border-b border-base-content/6">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-warning/15 flex items-center justify-center">
              <svg class="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-base-content">Rate Limiting</p>
              <p class="text-xs text-base-content/35">Batasi penggunaan untuk mencegah abuse</p>
            </div>
          </div>
          <span class="badge badge-warning badge-outline badge-sm">Coming Soon</span>
        </div>

        <div class="px-6 py-5 flex flex-col gap-0 divide-y divide-base-content/5">

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content/40">Request per Menit (RPM)</p>
              <p class="text-xs text-base-content/25 mt-0.5">Batas request API per pengguna per menit.</p>
            </div>
            <div class="sm:w-36 shrink-0">
              <label class="input input-sm flex items-center gap-2 rounded-xl border-base-content/6 bg-base-100/30 opacity-40 cursor-not-allowed">
                <input type="number" disabled value="60" class="grow bg-transparent text-sm focus:outline-none w-0" />
                <span class="text-xs text-base-content/25 shrink-0">req/min</span>
              </label>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 last:pb-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content/40">Token per Hari</p>
              <p class="text-xs text-base-content/25 mt-0.5">Batas token output harian per pengguna.</p>
            </div>
            <div class="sm:w-36 shrink-0">
              <label class="input input-sm flex items-center gap-2 rounded-xl border-base-content/6 bg-base-100/30 opacity-40 cursor-not-allowed">
                <input type="number" disabled value="100000" class="grow bg-transparent text-sm focus:outline-none w-0" />
                <span class="text-xs text-base-content/25 shrink-0">token</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════
           SECTION 3: MODEL DEFAULTS
      ══════════════════════════════════ -->
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 overflow-hidden">

        <div class="flex items-center justify-between px-6 py-4 border-b border-base-content/6">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-base-content">Model Defaults</p>
              <p class="text-xs text-base-content/35">Konfigurasi model LLM global</p>
            </div>
          </div>
          <span class="badge badge-warning badge-outline badge-sm">Coming Soon</span>
        </div>

        <div class="px-6 py-5 flex flex-col gap-0 divide-y divide-base-content/5">

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content/40">Ollama Base URL</p>
              <p class="text-xs text-base-content/25 mt-0.5">Endpoint server Ollama lokal atau remote.</p>
            </div>
            <div class="sm:w-52 shrink-0">
              <label class="input input-sm flex items-center gap-2 rounded-xl border-base-content/6 bg-base-100/30 opacity-40 cursor-not-allowed">
                <input type="text" disabled value="http://localhost:11434" class="grow bg-transparent text-xs focus:outline-none w-0" />
              </label>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 last:pb-0">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content/40">Temperature Default</p>
              <p class="text-xs text-base-content/25 mt-0.5">Nilai kreativitas output model (0.0 – 1.0).</p>
            </div>
            <div class="sm:w-36 shrink-0">
              <label class="input input-sm flex items-center gap-2 rounded-xl border-base-content/6 bg-base-100/30 opacity-40 cursor-not-allowed">
                <input type="number" step="0.1" min="0" max="1" disabled value="0.7" class="grow bg-transparent text-sm focus:outline-none w-0" />
              </label>
            </div>
          </div>

        </div>
      </div>

      <!-- ─── SAVE BUTTON MOBILE ─── -->
      <div class="flex sm:hidden items-center gap-3 pt-1">
        <button
          class="btn btn-primary flex-1 gap-2 shadow-lg shadow-primary/20 rounded-xl"
          :disabled="saving"
          @click="saveAll"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs"></span>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Simpan Pengaturan
        </button>
      </div>

      <!-- ─── FEEDBACK TOAST MOBILE ─── -->
      <Transition name="fade">
        <div v-if="saveSuccess || saveError" class="flex sm:hidden items-center gap-2 text-sm font-medium"
          :class="saveSuccess ? 'text-success' : 'text-error'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path v-if="saveSuccess" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          {{ saveSuccess ? 'Pengaturan berhasil disimpan!' : saveError }}
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], ssr: false })

const api = useApi()

// ─── Load settings ────────────────────────────────────
const { data: settings } = await useAsyncData('admin-settings-page',
  () => api.get<Record<string, string>>('/api/admin/settings'),
)

const form = reactive({
  guest_enabled:      settings.value?.guest_enabled       ?? 'true',
  guest_max_messages: settings.value?.guest_max_messages  ?? '5',
  guest_default_model: settings.value?.guest_default_model ?? 'llama3.2',
})

const saving      = ref(false)
const saveSuccess = ref(false)
const saveError   = ref('')

function onGuestToggle(event: Event) {
  const target = event.target as HTMLInputElement | null
  form.guest_enabled = target?.checked ? 'true' : 'false'
}

// ─── Save handler ─────────────────────────────────────
async function saveAll() {
  saving.value = true
  saveSuccess.value = false
  saveError.value = ''
  try {
    await Promise.all(
      Object.entries(form).map(([key, value]) =>
        api.patch('/api/admin/settings', { key, value }),
      ),
    )
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  }
  catch (err: unknown) {
    saveError.value = (err as { data?: { message?: string } }).data?.message ?? 'Gagal menyimpan pengaturan'
  }
  finally {
    saving.value = false
  }
}
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>