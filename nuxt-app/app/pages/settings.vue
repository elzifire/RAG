<script setup lang="ts">
import { startRegistration } from '@simplewebauthn/browser'

definePageMeta({ ssr: false, middleware: ['auth'] })

const auth = useAuthStore()
const router = useRouter()
const api = useApi()

// ── Profile form ──────────────────────────────────────────────────────────
const profileName = ref(auth.user?.name ?? '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPw = ref(false)
const showNewPw = ref(false)
const profileLoading = ref(false)
const profileSuccess = ref('')
const profileError = ref('')

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''

  if (newPassword.value && newPassword.value !== confirmPassword.value) {
    profileError.value = 'New passwords do not match'
    return
  }

  profileLoading.value = true
  try {
    const body: Record<string, string> = {}
    if (profileName.value.trim() !== auth.user?.name) body.name = profileName.value.trim()
    if (newPassword.value) {
      body.currentPassword = currentPassword.value
      body.newPassword = newPassword.value
    }
    if (!Object.keys(body).length) {
      profileSuccess.value = 'Nothing changed'
      return
    }
    const updated = await api.patch<{ id: string; email: string; name: string; role: string }>('/api/auth/profile', body)
    auth.persistUser(updated)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    profileSuccess.value = 'Profile updated successfully'
  }
  catch (err: unknown) {
    profileError.value = (err as { data?: { message?: string } }).data?.message ?? 'Update failed'
  }
  finally {
    profileLoading.value = false
  }
}

// ── Passkeys ──────────────────────────────────────────────────────────────
interface PasskeyItem { id: string; deviceType: string; transports: string[]; createdAt: string }

const passkeys = ref<PasskeyItem[]>([])
const passkeysLoading = ref(false)
const passkeysError = ref('')
const registeringPasskey = ref(false)
const registerSuccess = ref('')
const deletingId = ref<string | null>(null)

async function loadPasskeys() {
  passkeysLoading.value = true
  passkeysError.value = ''
  try {
    passkeys.value = await api.get<PasskeyItem[]>('/api/auth/passkeys')
  }
  catch {
    passkeysError.value = 'Failed to load passkeys'
  }
  finally {
    passkeysLoading.value = false
  }
}

async function addPasskey() {
  registeringPasskey.value = true
  registerSuccess.value = ''
  passkeysError.value = ''
  try {
    const options = await api.post<Record<string, unknown>>('/api/auth/passkey/register-options', {})
    const credential = await startRegistration({ optionsJSON: options as Parameters<typeof startRegistration>[0]['optionsJSON'] })
    await api.post('/api/auth/passkey/register-verify', credential)
    registerSuccess.value = 'Passkey registered successfully!'
    await loadPasskeys()
  }
  catch (err: unknown) {
    passkeysError.value =
      (err as { data?: { message?: string } }).data?.message ??
      (err instanceof Error ? err.message : 'Passkey registration failed')
  }
  finally {
    registeringPasskey.value = false
  }
}

async function deletePasskey(id: string) {
  deletingId.value = id
  try {
    await api.del(`/api/auth/passkeys/${id}`)
    passkeys.value = passkeys.value.filter(p => p.id !== id)
  }
  catch {
    passkeysError.value = 'Failed to remove passkey'
  }
  finally {
    deletingId.value = null
  }
}

function deviceLabel(pk: PasskeyItem) {
  if (pk.transports.includes('internal')) return 'Built-in (Face/Touch ID)'
  if (pk.transports.includes('usb')) return 'Security Key (USB)'
  if (pk.transports.includes('nfc')) return 'NFC Key'
  if (pk.transports.includes('ble')) return 'Bluetooth Key'
  return pk.deviceType === 'multiDevice' ? 'Synced Passkey' : 'Hardware Key'
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

onMounted(() => {
  auth.hydrateFromStorage()
  profileName.value = auth.user?.name ?? ''
  loadPasskeys()
})
</script>

<template>
  <div class="min-h-screen bg-base-200/40">
    <!-- Sticky top bar -->
    <div class="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md border-b border-base-200/60">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        <button class="btn btn-ghost btn-sm btn-circle" @click="router.back()">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="flex-1">
          <h1 class="text-base font-semibold tracking-tight leading-none">Account Settings</h1>
          <p class="text-xs text-base-content/40 mt-0.5 leading-none">Profile, security, passkeys</p>
        </div>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-6 space-y-4">

      <!-- ── User Info Banner ──────────────────────────────────── -->
      <div class="flex items-center gap-4 px-5 py-4 bg-base-100 rounded-2xl border border-base-200/60 shadow-sm">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md">
          {{ auth.user?.name?.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm truncate">{{ auth.user?.name }}</p>
          <p class="text-xs text-base-content/50 truncate">{{ auth.user?.email }}</p>
        </div>
        <span
          class="badge badge-sm font-medium shrink-0"
          :class="auth.user?.role === 'ADMIN' ? 'badge-warning' : 'badge-ghost'"
        >{{ auth.user?.role }}</span>
      </div>

      <!-- ── Profile Form ──────────────────────────────────────── -->
      <div class="bg-base-100 rounded-2xl border border-base-200/60 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-base-200/60 flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <h2 class="text-sm font-semibold leading-tight">Profile</h2>
            <p class="text-xs text-base-content/40 leading-tight">Update your display name</p>
          </div>
        </div>
        <div class="px-5 py-5 space-y-4">
          <Transition name="alert-fade">
            <div v-if="profileSuccess" class="alert alert-success py-2.5 px-4 text-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ profileSuccess }}
            </div>
          </Transition>
          <Transition name="alert-fade">
            <div v-if="profileError" class="alert alert-error py-2.5 px-4 text-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ profileError }}
            </div>
          </Transition>

          <form class="space-y-4" @submit.prevent="saveProfile">
            <div class="form-control">
              <label class="label pt-0 pb-1.5"><span class="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Display Name</span></label>
              <input v-model="profileName" type="text" class="input input-bordered rounded-xl w-full focus:input-primary" placeholder="Your name" required />
            </div>

            <details class="group">
              <summary class="flex items-center gap-2 cursor-pointer list-none select-none text-xs font-medium text-base-content/50 hover:text-base-content transition-colors py-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                Change password
              </summary>
              <div class="mt-3 space-y-3 pl-5 border-l-2 border-base-200">
                <div class="form-control">
                  <label class="label pt-0 pb-1"><span class="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Current Password</span></label>
                  <div class="relative">
                    <input v-model="currentPassword" :type="showCurrentPw ? 'text' : 'password'" class="input input-bordered rounded-xl w-full pr-10 focus:input-primary" placeholder="••••••••" autocomplete="current-password" />
                    <button type="button" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-content/30 hover:text-base-content transition-colors" @click="showCurrentPw = !showCurrentPw">
                      <svg v-if="!showCurrentPw" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="form-control">
                    <label class="label pt-0 pb-1"><span class="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">New Password</span></label>
                    <div class="relative">
                      <input v-model="newPassword" :type="showNewPw ? 'text' : 'password'" class="input input-bordered rounded-xl w-full pr-10 focus:input-primary" placeholder="Min. 8 chars" autocomplete="new-password" />
                      <button type="button" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-content/30 hover:text-base-content transition-colors" @click="showNewPw = !showNewPw">
                        <svg v-if="!showNewPw" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="form-control">
                    <label class="label pt-0 pb-1"><span class="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Confirm</span></label>
                    <input v-model="confirmPassword" type="password" class="input input-bordered rounded-xl w-full focus:input-primary" :class="{ 'input-error': confirmPassword && newPassword !== confirmPassword }" placeholder="Repeat" autocomplete="new-password" />
                  </div>
                </div>
              </div>
            </details>

            <div class="flex justify-end pt-1">
              <button type="submit" class="btn btn-primary btn-sm rounded-xl px-5 gap-2" :disabled="profileLoading">
                <span v-if="profileLoading" class="loading loading-spinner loading-xs"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ── Passkeys ──────────────────────────────────────────── -->
      <div class="bg-base-100 rounded-2xl border border-base-200/60 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-base-200/60 flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </div>
          <div class="flex-1">
            <h2 class="text-sm font-semibold leading-tight">Passkeys</h2>
            <p class="text-xs text-base-content/40 leading-tight">Biometric &amp; hardware key logins</p>
          </div>
          <button class="btn btn-primary btn-sm rounded-xl gap-1.5 px-3" :disabled="registeringPasskey" @click="addPasskey">
            <span v-if="registeringPasskey" class="loading loading-spinner loading-xs"></span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        </div>

        <div class="px-5 py-4 space-y-3">
          <Transition name="alert-fade">
            <div v-if="registerSuccess" class="alert alert-success py-2.5 px-4 text-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ registerSuccess }}
            </div>
          </Transition>
          <Transition name="alert-fade">
            <div v-if="passkeysError" class="alert alert-error py-2.5 px-4 text-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ passkeysError }}
            </div>
          </Transition>

          <!-- Skeleton -->
          <template v-if="passkeysLoading">
            <div v-for="i in 2" :key="i" class="h-14 skeleton rounded-xl" />
          </template>

          <!-- Empty -->
          <div v-else-if="!passkeys.length" class="flex flex-col items-center gap-2 py-10 text-center text-base-content/40">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            <p class="text-sm font-medium">No passkeys yet</p>
            <p class="text-xs opacity-60">Click "Add" to register Face ID, Touch ID, or a hardware key</p>
          </div>

          <!-- List -->
          <TransitionGroup v-else name="list" tag="div" class="space-y-2">
            <div
              v-for="pk in passkeys"
              :key="pk.id"
              class="flex items-center gap-3 px-4 py-3 bg-base-200/40 hover:bg-base-200/70 rounded-xl border border-base-200/60 transition-colors"
            >
              <div class="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center shrink-0 text-base-content/50">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ deviceLabel(pk) }}</p>
                <p class="text-xs text-base-content/40 truncate">Added {{ formatDate(pk.createdAt) }}</p>
              </div>
              <button
                class="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 transition-colors"
                :disabled="deletingId === pk.id"
                title="Remove passkey"
                @click="deletePasskey(pk.id)"
              >
                <span v-if="deletingId === pk.id" class="loading loading-spinner loading-xs"></span>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- ── Danger Zone ───────────────────────────────────────── -->
      <div class="bg-base-100 rounded-2xl border border-error/20 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-error/10 flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 class="text-sm font-semibold text-error leading-tight">Danger Zone</h2>
        </div>
        <div class="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium">Logout</p>
            <p class="text-xs text-base-content/40 mt-0.5">Clears your local session and token</p>
          </div>
          <button class="btn btn-error btn-outline btn-sm rounded-xl shrink-0" @click="auth.logout(); router.replace('/login')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.alert-fade-enter-active, .alert-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.alert-fade-enter-from, .alert-fade-leave-to { opacity: 0; transform: translateY(-4px); }

.list-enter-active, .list-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-8px); }
</style>
