<template>
	<div class="relative h-[100dvh] overflow-hidden bg-base-100" data-theme="night">
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div class="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-primary/12 blur-3xl"></div>
			<div class="absolute -bottom-24 -left-14 h-80 w-80 rounded-full bg-secondary/10 blur-3xl"></div>
		</div>

		<div class="relative flex h-full overflow-hidden">
			<Transition name="fade-overlay">
				<button
					v-if="sidebarOpen"
					class="fixed inset-0 z-30 bg-black/35 backdrop-blur-[1px] lg:hidden"
					aria-label="Close Sidebar"
					@click="sidebarOpen = false"
				></button>
			</Transition>

			<aside
				class="fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col border-r border-base-content/10 bg-base-200/90 backdrop-blur-md shadow-2xl transition-transform duration-300 lg:static lg:z-20 lg:translate-x-0 lg:shadow-none"
				:class="[
					sidebarOpen ? 'translate-x-0' : '-translate-x-full',
					sidebarCompact ? 'lg:w-20' : 'lg:w-[17.5rem]',
				]"
			>
				<div class="flex h-16 items-center gap-3 border-b border-base-content/10 px-4">
					<div class="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-content shadow-lg shadow-primary/20">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 12h7m4 0h7M6 6h12M6 18h12" />
						</svg>
					</div>
					<Transition name="fade-text">
						<div v-if="!sidebarCompact" class="min-w-0">
							<p class="font-display truncate text-sm font-bold text-base-content">RAG Admin</p>
							<p class="text-[10px] text-base-content/35">Control Center</p>
						</div>
					</Transition>
				</div>

				<nav class="flex-1 overflow-y-auto px-3 py-3">
					<div v-for="group in navGroups" :key="group.title" class="mb-4">
						<Transition name="fade-text">
							<p v-if="!sidebarCompact" class="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-base-content/30">
								{{ group.title }}
							</p>
						</Transition>

						<NuxtLink
							v-for="item in group.items"
							:key="item.to"
							:to="item.to"
							class="group relative mb-1 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-150"
							:class="isActive(item.to)
								? 'border-primary/20 bg-primary/15 text-primary'
								: 'border-transparent text-base-content/55 hover:border-base-content/10 hover:bg-base-content/5 hover:text-base-content'"
							:title="sidebarCompact ? item.label : undefined"
							@click="sidebarOpen = false"
						>
							<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" :d="item.iconPath" />
							</svg>
							<Transition name="fade-text">
								<span v-if="!sidebarCompact" class="truncate">{{ item.label }}</span>
							</Transition>

							<span
								v-if="sidebarCompact"
								class="pointer-events-none absolute left-full ml-2 rounded-lg border border-base-content/10 bg-base-300 px-2 py-1 text-xs text-base-content opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
							>
								{{ item.label }}
							</span>
						</NuxtLink>
					</div>

					<div class="my-3 h-px bg-base-content/10"></div>

					<NuxtLink
						to="/chat"
						class="group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-base-content/45 transition-all duration-150 hover:border-base-content/10 hover:bg-base-content/5 hover:text-base-content"
						:title="sidebarCompact ? 'Kembali ke Chat' : undefined"
						@click="sidebarOpen = false"
					>
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
						</svg>
						<Transition name="fade-text">
							<span v-if="!sidebarCompact">Kembali ke Chat</span>
						</Transition>
						<span
							v-if="sidebarCompact"
							class="pointer-events-none absolute left-full ml-2 rounded-lg border border-base-content/10 bg-base-300 px-2 py-1 text-xs text-base-content opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
						>
							Kembali ke Chat
						</span>
					</NuxtLink>
				</nav>

				<div class="border-t border-base-content/10 p-3">
					<div class="mb-2 rounded-xl border border-base-content/10 bg-base-content/5 p-2.5">
						<div class="mb-2 flex items-center justify-between">
							<p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-base-content/40">App Health</p>
							<button
								class="btn btn-ghost btn-xs h-6 min-h-0 px-2 text-[10px]"
								:disabled="dbHealthLoading"
								@click="fetchDbHealth"
							>
								<span v-if="dbHealthLoading" class="loading loading-spinner loading-xs"></span>
								<span v-else>Refresh</span>
							</button>
						</div>

						<div class="space-y-1 text-[11px]">
							<p class="text-base-content/65">
								DB Source:
								<span class="font-semibold" :class="dbHealth?.activeSource === 'primary' ? 'text-success' : dbHealth?.activeSource === 'fallback' ? 'text-warning' : 'text-base-content/60'">
									{{ dbHealth?.activeSource || 'unknown' }}
								</span>
							</p>
							<p class="text-base-content/65">
								Ping:
								<span class="font-semibold" :class="dbHealth?.pingOk ? 'text-success' : 'text-error'">
									{{ dbHealth?.pingOk ? 'ok' : 'failed' }}
								</span>
							</p>
							<p class="text-base-content/40">
								Latency: {{ dbHealth?.latencyMs ?? '-' }} ms
							</p>
							<p v-if="dbHealthError" class="truncate text-[10px] text-error/80" :title="dbHealthError">
								{{ dbHealthError }}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2 rounded-xl bg-base-content/5 p-2.5">
						<div class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-warning to-orange-400 text-xs font-bold text-black">
							{{ auth.user?.name?.charAt(0)?.toUpperCase() || 'A' }}
						</div>
						<Transition name="fade-text">
							<div v-if="!sidebarCompact" class="min-w-0">
								<p class="truncate text-xs font-semibold text-base-content/75">{{ auth.user?.name || 'Administrator' }}</p>
								<p class="truncate text-[10px] text-base-content/35">{{ auth.user?.email || 'admin@local' }}</p>
							</div>
						</Transition>
					</div>
				</div>
			</aside>

			<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
				<header class="z-10 flex h-16 shrink-0 items-center gap-2 border-b border-base-content/10 bg-base-100/70 px-3 backdrop-blur-sm sm:px-4">
					<button
						class="btn btn-ghost btn-sm h-9 min-h-0 w-9 rounded-xl p-0 text-base-content/60 hover:text-base-content lg:hidden"
						@click="sidebarOpen = true"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>

					<button
						class="btn btn-ghost btn-sm hidden h-9 min-h-0 rounded-xl px-3 text-xs text-base-content/45 hover:text-base-content lg:inline-flex"
						@click="sidebarCompact = !sidebarCompact"
					>
						{{ sidebarCompact ? 'Expand Menu' : 'Compact Menu' }}
					</button>

					<div class="ml-1 min-w-0">
						<p class="truncate text-sm font-semibold text-base-content">{{ currentPageLabel }}</p>
						<p class="truncate text-[11px] text-base-content/35">Admin / {{ currentPageLabel }}</p>
					</div>

					<div class="flex-1"></div>

					<span class="hidden text-xs text-base-content/35 md:block">{{ dateStr }}</span>

					<div class="relative">
						<button
							class="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-base-content/5"
							@click="showUserMenu = !showUserMenu"
						>
							<div class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-warning to-orange-400 text-xs font-bold text-black">
								{{ auth.user?.name?.charAt(0)?.toUpperCase() || 'A' }}
							</div>
							<svg class="h-3.5 w-3.5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						<Transition name="dropdown">
							<div
								v-if="showUserMenu"
								class="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-2xl border border-base-content/10 bg-base-200 shadow-2xl"
							>
								<div class="border-b border-base-content/10 px-3 py-2.5">
									<p class="truncate text-xs font-semibold text-base-content/75">{{ auth.user?.name || 'Administrator' }}</p>
									<p class="truncate text-[10px] text-base-content/40">{{ auth.user?.email || 'admin@local' }}</p>
								</div>
								<NuxtLink to="/chat" class="flex items-center gap-2 px-3 py-2 text-sm text-base-content/65 transition-colors hover:bg-base-content/5 hover:text-base-content" @click="showUserMenu = false">
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
									</svg>
									Ke Chat
								</NuxtLink>
								<button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-error/75 transition-colors hover:bg-error/10 hover:text-error" @click="logout">
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									Logout
								</button>
							</div>
						</Transition>
					</div>
				</header>

				<main class="flex-1 overflow-auto px-3 py-3 sm:px-4 sm:py-4" @click="showUserMenu = false">
					<slot />
				</main>

				<footer class="flex h-10 shrink-0 items-center justify-between border-t border-base-content/10 bg-base-200/40 px-4 text-[10px] text-base-content/30">
					<span>RAGChat Admin Dashboard</span>
					<span>{{ year }}</span>
				</footer>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { adminSidebarGroups } from '../utils/sidebar'
import { useApi } from '../composables/useApi'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const api = useApi()

const sidebarOpen = ref(false)
const sidebarCompact = ref(false)
const showUserMenu = ref(false)
const dbHealthLoading = ref(false)
const dbHealthError = ref<string | null>(null)

interface DbHealthStatus {
	checkedAt: string
	latencyMs: number
	pingOk: boolean
	pingError: string | null
	activeSource: 'primary' | 'fallback' | 'unknown'
}

const dbHealth = ref<DbHealthStatus | null>(null)

const navGroups = adminSidebarGroups

function isActive(to: string) {
	if (to === '/admin') return route.path === '/admin'
	return route.path.startsWith(to)
}

const currentPageLabel = computed(() => {
	const flat = navGroups.flatMap(g => g.items)
	return flat.find(item => isActive(item.to))?.label ?? 'Dashboard'
})

const year = new Date().getFullYear()
const dateStr = ref('')

let timer: ReturnType<typeof setInterval> | null = null
let healthTimer: ReturnType<typeof setInterval> | null = null

async function fetchDbHealth() {
	dbHealthLoading.value = true
	dbHealthError.value = null

	try {
		dbHealth.value = await api.get<DbHealthStatus>('/api/internal/db-connection')
	}
	catch (err: unknown) {
		dbHealthError.value = (err as { data?: { message?: string } }).data?.message
			?? (err instanceof Error ? err.message : 'Failed to fetch app health')
	}
	finally {
		dbHealthLoading.value = false
	}
}

onMounted(() => {
	const formatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
	const tick = () => {
		dateStr.value = formatter.format(new Date())
	}
	tick()
	timer = setInterval(tick, 60_000)
	fetchDbHealth()
	healthTimer = setInterval(fetchDbHealth, 30_000)
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
	if (healthTimer) clearInterval(healthTimer)
})

function logout() {
	auth.logout()
	showUserMenu.value = false
	router.replace('/login')
}
</script>

<style scoped>
.font-display {
	font-family: 'Syne', sans-serif;
}

.fade-text-enter-active,
.fade-text-leave-active {
	transition: opacity 0.15s, transform 0.15s;
}

.fade-text-enter-from,
.fade-text-leave-to {
	opacity: 0;
	transform: translateX(-4px);
}

.dropdown-enter-active,
.dropdown-leave-active {
	transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-5px) scale(0.98);
}

.fade-overlay-enter-active,
.fade-overlay-leave-active {
	transition: opacity 0.2s;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
	opacity: 0;
}
</style>