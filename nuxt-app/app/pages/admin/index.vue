<template>
  <div class="ui-admin-page space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-display font-bold text-2xl text-base-content">Dashboard</h1>
      <p class="text-sm text-base-content/40 mt-1">Ringkasan aktivitas RAGChat</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-2xl border border-base-content/8 bg-base-200/40 p-5"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-base-content/35 uppercase tracking-widest font-semibold">{{ stat.label }}</span>
          <div class="w-8 h-8 rounded-lg flex items-center justify-center text-base" :class="stat.iconBg">{{ stat.icon }}</div>
        </div>
        <p class="font-display font-black text-3xl text-base-content">
          <span v-if="pending">—</span>
          <span v-else>{{ stat.value }}</span>
        </p>
      </div>
    </div>

    <!-- Guest settings quick card -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-semibold text-base text-base-content">Pengaturan Guest Chat</h3>
          <NuxtLink to="/admin/settings" class="btn btn-ghost btn-xs border border-base-content/10">Edit</NuxtLink>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-base-content/50">Status</span>
            <span v-if="settings" class="badge" :class="settings.guest_enabled === 'true' ? 'badge-success' : 'badge-error'">
              {{ settings.guest_enabled === 'true' ? 'Aktif' : 'Nonaktif' }}
            </span>
            <span v-else class="badge badge-ghost">—</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-base-content/50">Maks pesan guest</span>
            <span class="font-semibold text-sm text-base-content">{{ settings?.guest_max_messages ?? '—' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-base-content/50">Model default</span>
            <span class="font-mono text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded-lg">{{ settings?.guest_default_model ?? '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Recent guest sessions -->
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-semibold text-base text-base-content">Guest Terkini</h3>
          <NuxtLink to="/admin/guests" class="btn btn-ghost btn-xs border border-base-content/10">Lihat semua</NuxtLink>
        </div>
        <div v-if="pending" class="flex justify-center py-6">
          <span class="loading loading-spinner loading-sm text-primary/40"></span>
        </div>
        <div v-else-if="!guestData?.recentGuests?.length" class="text-center py-6 text-sm text-base-content/25">Belum ada guest session</div>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="g in guestData.recentGuests.slice(0, 5)"
            :key="g.id"
            class="flex items-center justify-between text-xs"
          >
            <span class="font-mono text-base-content/40 truncate max-w-[120px]">{{ g.fingerprint.slice(0, 8) }}…</span>
            <span class="badge badge-ghost badge-xs">{{ g.messageCount }} pesan</span>
            <span class="text-base-content/25">{{ formatDate(g.lastMessageAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="rounded-2xl border border-base-content/8 bg-base-200/40 p-5">
      <h3 class="font-display font-semibold text-base text-base-content mb-4">Aksi Cepat</h3>
      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/admin/users" class="btn btn-sm btn-ghost border border-base-content/10 gap-2">
          👥 Kelola Pengguna
        </NuxtLink>
        <NuxtLink to="/admin/settings" class="btn btn-sm btn-ghost border border-base-content/10 gap-2">
          ⚙️ Pengaturan Aplikasi
        </NuxtLink>
        <NuxtLink to="/admin/guests" class="btn btn-sm btn-ghost border border-base-content/10 gap-2">
          👤 Guest Sessions
        </NuxtLink>
        <NuxtLink to="/try" target="_blank" class="btn btn-sm btn-ghost border border-base-content/10 gap-2">
          🚀 Lihat Halaman Guest
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], ssr: false })

const api = useApi()

const { data: settings, pending: settingsPending } = await useAsyncData('admin-settings',
  () => api.get<Record<string, string>>('/api/admin/settings'),
)

const { data: guestData, pending: guestPending } = await useAsyncData('admin-guests',
  () => api.get<{ totalUsers: number; totalGuests: number; totalGuestMessages: number; recentGuests: any[] }>('/api/admin/guests'),
)

const pending = computed(() => settingsPending.value || guestPending.value)

const stats = computed(() => [
  { label: 'Total Pengguna', value: guestData.value?.totalUsers ?? 0, icon: '👥', iconBg: 'bg-primary/15' },
  { label: 'Total Guest', value: guestData.value?.totalGuests ?? 0, icon: '👤', iconBg: 'bg-secondary/15' },
  { label: 'Pesan Guest', value: guestData.value?.totalGuestMessages ?? 0, icon: '💬', iconBg: 'bg-accent/15' },
  { label: 'Batas Pesan', value: settings.value?.guest_max_messages ?? '—', icon: '🔢', iconBg: 'bg-warning/15' },
])

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d))
}
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }
</style>
