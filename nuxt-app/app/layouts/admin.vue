<template>
  <div class="flex h-[100dvh] overflow-hidden bg-base-100" data-theme="night">

    <!-- ── Sidebar ── -->
    <aside
      class="shrink-0 flex flex-col border-r border-base-content/8 bg-base-200/50 backdrop-blur-md transition-all duration-300 z-30"
      :class="sidebarOpen ? 'w-60' : 'w-0 md:w-16 overflow-hidden'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center gap-3 px-4 border-b border-base-content/8 shrink-0">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
          <svg class="w-4 h-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
          </svg>
        </div>
        <Transition name="fade-text">
          <div v-if="sidebarOpen">
            <p class="font-display font-bold text-sm text-base-content leading-none whitespace-nowrap">Admin Panel</p>
            <p class="text-[10px] text-base-content/30 mt-0.5">RAGChat</p>
          </div>
        </Transition>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative"
          :class="isActive(item.to)
            ? 'bg-primary/15 text-primary border border-primary/15'
            : 'text-base-content/50 hover:text-base-content hover:bg-base-content/5 border border-transparent'"
          :title="!sidebarOpen ? item.label : undefined"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          <Transition name="fade-text">
            <span v-if="sidebarOpen" class="whitespace-nowrap">{{ item.label }}</span>
          </Transition>
          <!-- Tooltip for collapsed state -->
          <span
            v-if="!sidebarOpen"
            class="absolute left-full ml-2 px-2 py-1 bg-base-300 text-base-content text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-base-content/10 shadow-lg"
          >{{ item.label }}</span>
        </NuxtLink>

        <div class="h-px bg-base-content/8 my-2 mx-1"></div>

        <NuxtLink
          to="/chat"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-base-content/35 hover:text-base-content hover:bg-base-content/5 border border-transparent transition-all duration-150 group relative"
          :title="!sidebarOpen ? 'Kembali ke Chat' : undefined"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <Transition name="fade-text">
            <span v-if="sidebarOpen" class="whitespace-nowrap">Kembali ke Chat</span>
          </Transition>
          <span
            v-if="!sidebarOpen"
            class="absolute left-full ml-2 px-2 py-1 bg-base-300 text-base-content text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-base-content/10 shadow-lg"
          >Kembali ke Chat</span>
        </NuxtLink>
      </nav>

      <!-- Admin info (bottom) -->
      <div class="px-2 pb-3 shrink-0 border-t border-base-content/8 pt-3">
        <div
          class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-base-content/4 border border-base-content/8 cursor-pointer hover:bg-base-content/7 transition-colors group"
          @click="showUserMenu = !showUserMenu"
        >
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-warning/80 to-orange-500/60 flex items-center justify-center text-xs font-bold text-black shrink-0">
            {{ auth.user?.name?.charAt(0).toUpperCase() ?? 'A' }}
          </div>
          <Transition name="fade-text">
            <div v-if="sidebarOpen" class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-base-content/70 truncate">{{ auth.user?.name }}</p>
              <p class="text-[10px] text-warning/60">Administrator</p>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- ── Main area ── -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Topbar -->
      <header class="h-16 shrink-0 flex items-center gap-3 px-4 border-b border-base-content/8 bg-base-200/30 backdrop-blur-sm z-20">
        <!-- Toggle sidebar -->
        <button
          class="btn btn-ghost btn-sm rounded-xl w-9 h-9 min-h-0 p-0 text-base-content/50 hover:text-base-content"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-base-content/30">Admin</span>
          <svg class="w-3.5 h-3.5 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          <span class="font-semibold text-base-content/70">{{ currentPageLabel }}</span>
        </div>

        <div class="flex-1"></div>

        <!-- Notification badge placeholder -->
        <div class="flex items-center gap-2">
          <!-- Date/time -->
          <span class="text-xs text-base-content/25 hidden sm:block">{{ dateStr }}</span>

          <!-- Avatar + dropdown -->
          <div class="relative" @click.stop>
            <button
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-base-content/5 transition-colors"
              @click="showUserMenu = !showUserMenu"
            >
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-warning/80 to-orange-500/60 flex items-center justify-center text-xs font-bold text-black">
                {{ auth.user?.name?.charAt(0).toUpperCase() ?? 'A' }}
              </div>
              <span class="text-sm font-medium text-base-content/60 hidden sm:block">{{ auth.user?.name }}</span>
              <svg class="w-3.5 h-3.5 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>

            <!-- Dropdown -->
            <Transition name="dropdown">
              <div
                v-if="showUserMenu"
                class="absolute right-0 top-full mt-1 w-44 bg-base-200 border border-base-content/10 rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div class="px-3 py-2.5 border-b border-base-content/8">
                  <p class="text-xs font-semibold text-base-content/70 truncate">{{ auth.user?.name }}</p>
                  <p class="text-[10px] text-base-content/35 truncate">{{ auth.user?.email }}</p>
                </div>
                <NuxtLink to="/chat" class="flex items-center gap-2 px-3 py-2 text-sm text-base-content/60 hover:text-base-content hover:bg-base-content/5 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                  Ke Halaman Chat
                </NuxtLink>
                <button
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm text-error/70 hover:text-error hover:bg-error/5 transition-colors"
                  @click="logout"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  Logout
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto" @click="showUserMenu = false">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="shrink-0 h-10 flex items-center justify-between px-5 border-t border-base-content/5 bg-base-200/20">
        <span class="text-[10px] text-base-content/20">RAGChat Admin &copy; {{ new Date().getFullYear() }}</span>
        <span class="text-[10px] text-base-content/15">v{{ runtimeConfig.public.appVersion ?? '1.0.0' }}</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()

const sidebarOpen = ref(true)
const showUserMenu = ref(false)

// ── Icon components ─────────────────────────────────────────────────────────
const IconDashboard = defineComponent({ render: () =>
  h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }),
  ]),
})
const IconUsers = defineComponent({ render: () =>
  h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }),
  ]),
})
const IconSettings = defineComponent({ render: () =>
  h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }),
  ]),
})
const IconGuest = defineComponent({ render: () =>
  h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }),
  ]),
})
const IconToken = defineComponent({ render: () =>
  h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' }),
  ]),
})

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: IconDashboard },
  { label: 'Pengguna', to: '/admin/users', icon: IconUsers },
  { label: 'Access Tokens', to: '/admin/tokens', icon: IconToken },
  { label: 'Pengaturan', to: '/admin/settings', icon: IconSettings },
  { label: 'Guest Sessions', to: '/admin/guests', icon: IconGuest },
]

// Exact match for /admin, prefix match for children
function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

const currentPageLabel = computed(
  () => navItems.find(i => isActive(i.to))?.label ?? 'Admin',
)

// Live date string
const dateStr = ref('')
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' })
  const tick = () => { dateStr.value = fmt.format(new Date()) }
  tick()
  timer = setInterval(tick, 30_000)
})
onUnmounted(() => clearInterval(timer))

function logout() {
  auth.logout()
  navigateTo('/login', { replace: true })
}
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }

.fade-text-enter-active { transition: opacity 0.15s, transform 0.15s; }
.fade-text-leave-active { transition: opacity 0.1s; }
.fade-text-enter-from  { opacity: 0; transform: translateX(-4px); }
.fade-text-leave-to    { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.dropdown-enter-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-leave-active { transition: opacity 0.1s; }
.dropdown-enter-from   { opacity: 0; transform: translateY(-6px) scale(0.97); }
.dropdown-leave-to     { opacity: 0; }
</style>

