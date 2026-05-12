<template>
  <div class="ui-admin-page space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-display font-bold text-2xl text-base-content">Access Tokens</h1>
        <p class="text-sm text-base-content/40 mt-1">Token akses berbatas pesan — kirim via header <code class="text-primary/70">X-Access-Token</code></p>
      </div>
      <button class="btn btn-primary btn-sm rounded-xl gap-2 shadow-md shadow-primary/20" @click="openCreateModal">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Buat Token
      </button>
    </div>

    <!-- Token table -->
    <div class="rounded-2xl border border-base-content/8 bg-base-200/30 overflow-hidden">
      <div v-if="pending" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-md text-primary/40"></span>
      </div>

      <table v-else class="table table-sm w-full">
        <thead>
          <tr class="border-base-content/8 bg-base-200/60">
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Label / Token</th>
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Penggunaan</th>
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Status</th>
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Expired At</th>
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in tokens"
            :key="t.id"
            class="border-base-content/5 hover:bg-base-content/2 transition-colors"
          >
            <!-- Label + token hash -->
            <td class="py-3 max-w-[220px]">
              <p class="text-sm font-medium text-base-content/80 mb-0.5">{{ t.label || '(tidak ada label)' }}</p>
              <div class="flex items-center gap-1.5">
                <code class="text-[10px] text-base-content/30 font-mono truncate max-w-[160px]">{{ t.token }}</code>
                <button
                  class="text-base-content/25 hover:text-primary transition-colors"
                  title="Salin token"
                  @click="copyToken(t.token)"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </td>

            <!-- Usage progress -->
            <td class="py-3 w-40">
              <div class="flex items-center justify-between text-[10px] text-base-content/35 mb-1">
                <span>{{ t.messageCount }} / {{ t.messageLimit }}</span>
                <span>{{ t.remaining }} tersisa</span>
              </div>
              <div class="w-full h-1.5 bg-base-content/8 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="t.exhausted ? 'bg-error' : t.messageCount / t.messageLimit > 0.7 ? 'bg-warning' : 'bg-primary'"
                  :style="`width:${t.messageLimit ? Math.min(100, (t.messageCount / t.messageLimit) * 100) : 0}%`"
                ></div>
              </div>
            </td>

            <!-- Status badge -->
            <td>
              <span
                class="badge badge-xs"
                :class="!t.isActive ? 'badge-error' : t.exhausted ? 'badge-warning' : t.isExpired ? 'badge-ghost' : 'badge-success'"
              >
                {{ !t.isActive ? 'Nonaktif' : t.exhausted ? 'Habis' : t.isExpired ? 'Expired' : 'Aktif' }}
              </span>
            </td>

            <!-- Expired at -->
            <td class="text-xs text-base-content/35">
              {{ t.expiredAt ? formatDate(t.expiredAt) : '∞ Selamanya' }}
            </td>

            <!-- Actions -->
            <td>
              <button
                v-if="t.isActive"
                class="btn btn-xs btn-error btn-outline rounded-lg gap-1"
                :disabled="deactivating === t.id"
                @click="deactivate(t.id)"
              >
                <span v-if="deactivating === t.id" class="loading loading-spinner loading-xs"></span>
                <template v-else>Nonaktifkan</template>
              </button>
              <span v-else class="text-xs text-base-content/20">—</span>
            </td>
          </tr>
          <tr v-if="!tokens?.length">
            <td colspan="5" class="text-center py-12 text-sm text-base-content/25">Belum ada token. Klik "Buat Token" untuk membuat yang pertama.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Copy toast -->
    <Transition name="fade">
      <div v-if="copied" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-success/90 text-success-content text-sm shadow-lg">
        Token disalin ke clipboard!
      </div>
    </Transition>

    <!-- Create Token Modal -->
    <dialog ref="createDialog" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box rounded-3xl bg-base-200 border border-base-content/10 max-w-md">
        <h3 class="font-display font-bold text-lg text-base-content mb-1">Buat Access Token</h3>
        <p class="text-sm text-base-content/40 mb-5">Token akan di-generate secara otomatis sebagai random hash.</p>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-base-content/60 block mb-1.5">Label (opsional)</label>
            <input
              v-model="form.label"
              type="text"
              placeholder="Contoh: Beta Tester VIP"
              class="input w-full rounded-xl border-base-content/10 bg-base-100/50 focus:border-primary/40"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-base-content/60 block mb-1.5">Batas Pesan <span class="text-error">*</span></label>
            <input
              v-model.number="form.messageLimit"
              type="number"
              min="1"
              placeholder="Contoh: 50"
              class="input w-full rounded-xl border-base-content/10 bg-base-100/50 focus:border-primary/40"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-base-content/60 block mb-1.5">Expired At (opsional)</label>
            <p class="text-xs text-base-content/30 mb-1.5">Kosongkan untuk token tanpa masa expired</p>
            <input
              v-model="form.expiredAt"
              type="datetime-local"
              class="input w-full rounded-xl border-base-content/10 bg-base-100/50 focus:border-primary/40"
            />
          </div>
        </div>

        <div class="modal-action mt-6 gap-2">
          <button class="btn btn-ghost rounded-xl border border-base-content/10" @click="closeCreateModal">Batal</button>
          <button
            class="btn btn-primary rounded-xl gap-2"
            :disabled="creating || !form.messageLimit"
            @click="createToken"
          >
            <span v-if="creating" class="loading loading-spinner loading-xs"></span>
            Generate Token
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @submit.prevent="closeCreateModal">
        <button>close</button>
      </form>
    </dialog>

    <!-- New token result modal -->
    <dialog ref="resultDialog" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box rounded-3xl bg-base-200 border border-base-content/10 max-w-md">
        <h3 class="font-display font-bold text-lg text-base-content mb-1">Token Berhasil Dibuat</h3>
        <p class="text-sm text-base-content/40 mb-4">Simpan token ini sekarang — tidak akan ditampilkan lagi setelah modal ditutup.</p>
        <div class="rounded-xl bg-base-100/60 border border-base-content/10 p-3 flex items-center gap-2">
          <code class="flex-1 text-xs text-primary break-all font-mono">{{ newToken }}</code>
          <button class="btn btn-xs btn-ghost rounded-lg" @click="copyToken(newToken)">Salin</button>
        </div>
        <div class="modal-action mt-5">
          <button class="btn btn-primary rounded-xl" @click="closeResultModal">Selesai</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @submit.prevent="closeResultModal">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], ssr: false })

interface TokenRow {
  id: string
  token: string
  label: string | null
  grantedAt: string
  expiredAt: string | null
  isActive: boolean
  messageLimit: number
  messageCount: number
  remaining: number
  exhausted: boolean
  isExpired: boolean
  admin: { name: string }
}

const api = useApi()
const createDialog = ref<HTMLDialogElement>()
const resultDialog = ref<HTMLDialogElement>()
const creating = ref(false)
const deactivating = ref<string | null>(null)
const copied = ref(false)
const newToken = ref('')

const form = ref({ label: '', messageLimit: 10, expiredAt: '' })

const { data: tokens, pending, refresh } = await useAsyncData('admin-tokens',
  () => api.get<TokenRow[]>('/api/admin/tokens'),
)

function openCreateModal() {
  form.value = { label: '', messageLimit: 10, expiredAt: '' }
  createDialog.value?.showModal()
}

function closeCreateModal() {
  createDialog.value?.close()
}

function closeResultModal() {
  resultDialog.value?.close()
  newToken.value = ''
}

async function createToken() {
  if (!form.value.messageLimit || form.value.messageLimit < 1) return
  creating.value = true
  try {
    const result = await api.post<{ token: string }>('/api/admin/tokens', {
      label: form.value.label || undefined,
      messageLimit: form.value.messageLimit,
      expiredAt: form.value.expiredAt || null,
    })
    closeCreateModal()
    newToken.value = result.token
    resultDialog.value?.showModal()
    await refresh()
  }
  catch (err: unknown) {
    alert((err as { data?: { message?: string } }).data?.message ?? 'Gagal membuat token')
  }
  finally {
    creating.value = false
  }
}

async function deactivate(id: string) {
  deactivating.value = id
  try {
    await api.del(`/api/admin/tokens/${id}`)
    await refresh()
  }
  catch (err: unknown) {
    alert((err as { data?: { message?: string } }).data?.message ?? 'Gagal menonaktifkan token')
  }
  finally {
    deactivating.value = null
  }
}

async function copyToken(token: string) {
  try {
    await navigator.clipboard.writeText(token)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch { /* fallback: silent */ }
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))
}
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
