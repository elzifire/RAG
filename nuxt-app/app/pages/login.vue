<script setup lang="ts">
import { startAuthentication } from '@simplewebauthn/browser'

definePageMeta({ ssr: false, layout: false })

const auth = useAuthStore()
const route = useRoute()

// ── Form state ────────────────────────────────────────────────────────────
const mode = ref<'login' | 'register'>('login')
const email = ref('')
const name = ref('')
const password = ref('')
const showPassword = ref(false)
const passkeyError = ref<string | null>(null)
const passkeyLoading = ref(false)

onMounted(async () => {
  auth.hydrateFromStorage()
  if (auth.isAuthenticated) {
    const redirect = (route.query.redirect as string) || '/chat'
    await navigateTo(redirect, { replace: true })
  }
})

// ── Submit ────────────────────────────────────────────────────────────────
async function submit() {
  auth.error = null
  passkeyError.value = null
  let ok = false

  if (mode.value === 'login') {
    ok = await auth.login(email.value, password.value)
  }
  else {
    ok = await auth.register(email.value, name.value, password.value)
  }

  if (ok) {
    const redirect = (route.query.redirect as string) || '/chat'
    await navigateTo(redirect, { replace: true })
  }
}

// ── Passkey login ─────────────────────────────────────────────────────────
async function loginWithPasskey() {
  passkeyError.value = null
  passkeyLoading.value = true
  try {
    const options = await $fetch<Record<string, unknown>>('/api/auth/passkey/login-options', {
      method: 'POST',
      body: { email: email.value || undefined },
    })

    const assertion = await startAuthentication({ optionsJSON: options as Parameters<typeof startAuthentication>[0]['optionsJSON'] })

    const res = await $fetch<{ token: string; user: { id: string; email: string; name: string; role: string } }>(
      '/api/auth/passkey/login-verify',
      { method: 'POST', body: assertion },
    )

    // Use store helpers so both Pinia state AND localStorage are updated atomically
    auth.persistToken(res.token)
    auth.persistUser(res.user)

    await navigateTo('/chat', { replace: true })
  }
  catch (err: unknown) {
    passkeyError.value =
      (err as { data?: { message?: string } }).data?.message ??
      (err instanceof Error ? err.message : 'Passkey authentication failed')
  }
  finally {
    passkeyLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200/50 flex items-center justify-center p-4 sm:p-8">
    <div class="card w-full max-w-[420px] bg-base-100 shadow-2xl border border-base-200/60 rounded-3xl">
      <div class="card-body p-6 sm:p-10 gap-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-2 ring-8 ring-primary/5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-base-content">Welcome to RAG</h1>
          <p class="text-base-content/60 text-sm">
            {{ mode === 'login' ? 'Sign in to your account' : 'Create a new account' }}
          </p>
        </div>

        <!-- Error banner -->
        <div v-if="auth.error || passkeyError" class="alert alert-error text-sm py-3 rounded-xl animate-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ auth.error || passkeyError }}
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="submit">
          <div class="form-control w-full">
            <label class="label pb-1.5"><span class="label-text font-medium">Email</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <input
                v-model="email"
                type="email"
                placeholder="you@example.com"
                class="input input-bordered w-full pl-10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
                autocomplete="email"
              />
            </div>
          </div>

          <div v-if="mode === 'register'" class="form-control w-full animate-in slide-in-from-top-2 fade-in">
            <label class="label pb-1.5"><span class="label-text font-medium">Name</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                v-model="name"
                type="text"
                placeholder="John Doe"
                class="input input-bordered w-full pl-10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
                autocomplete="name"
              />
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label pb-1.5"><span class="label-text font-medium">Password</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input input-bordered w-full pl-10 pr-10 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-content/40 hover:text-base-content transition-colors"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full rounded-xl mt-4 border-none"
            :disabled="auth.isLoading"
          >
            <span v-if="auth.isLoading" class="loading loading-spinner loading-sm text-primary-content"></span>
            {{ mode === 'login' ? 'Sign in' : 'Create account' }}
          </button>
        </form>

        <div class="divider text-xs font-medium text-base-content/40 my-0">OR</div>

        <!-- Passkey button -->
        <button
          v-if="mode === 'login'"
          class="btn btn-outline w-full rounded-xl gap-2 hover:bg-base-content/5"
          :disabled="passkeyLoading"
          @click="loginWithPasskey"
        >
          <span v-if="passkeyLoading" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          Sign in with Passkey
        </button>

        <!-- Mode toggle -->
        <div class="text-center text-sm font-medium mt-2">
          <template v-if="mode === 'login'">
            <span class="text-base-content/60">Don't have an account?</span>
            <button class="link link-primary hover:text-primary-focus ml-1 transition-colors no-underline font-semibold" @click="mode = 'register'; auth.error = null">Sign up</button>
          </template>
          <template v-else>
            <span class="text-base-content/60">Already have an account?</span>
            <button class="link link-primary hover:text-primary-focus ml-1 transition-colors no-underline font-semibold" @click="mode = 'login'; auth.error = null">Log in</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
