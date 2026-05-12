<template>
  <div class="ui-admin-page space-y-5">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-display font-bold text-2xl text-base-content">Guest Sessions</h1>
        <p class="text-sm text-base-content/40 mt-1">Aktivitas chat tanpa login</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="badge badge-outline border-base-content/15 text-base-content/40 gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
          {{ data?.totalGuests ?? 0 }} sesi
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 p-4 text-center">
        <p class="text-2xl font-display font-black text-base-content">{{ data?.totalGuests ?? '—' }}</p>
        <p class="text-xs text-base-content/35 mt-1">Total Sesi</p>
      </div>
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 p-4 text-center">
        <p class="text-2xl font-display font-black text-base-content">{{ data?.totalGuestMessages ?? '—' }}</p>
        <p class="text-xs text-base-content/35 mt-1">Total Pesan</p>
      </div>
      <div class="rounded-2xl border border-base-content/8 bg-base-200/40 p-4 text-center">
        <p class="text-2xl font-display font-black text-base-content">
          {{ data?.totalGuests ? Math.round((data.totalGuestMessages ?? 0) / data.totalGuests * 10) / 10 : '—' }}
        </p>
        <p class="text-xs text-base-content/35 mt-1">Rata-rata Pesan/Sesi</p>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-2xl border border-base-content/8 bg-base-200/30 overflow-hidden">
      <div v-if="pending" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-md text-primary/40"></span>
      </div>
      <table v-else class="table table-sm w-full">
        <thead>
          <tr class="border-base-content/8 bg-base-200/60">
            <th class="text-xs uppercase tracking-widest text-base-content/30 py-3">Fingerprint</th>
            <th class="text-xs uppercase tracking-widest text-base-content/30 py-3">Pesan</th>
            <th class="text-xs uppercase tracking-widest text-base-content/30 py-3">Sesi Dibuat</th>
            <th class="text-xs uppercase tracking-widest text-base-content/30 py-3">Pesan Terakhir</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="g in data?.recentGuests"
            :key="g.id"
            class="border-base-content/5 hover:bg-base-content/2 transition-colors"
          >
            <td class="font-mono text-xs text-base-content/45">{{ g.fingerprint }}</td>
            <td>
              <div class="flex items-center gap-2">
                <span class="badge badge-xs" :class="g.messageCount >= (limitVal) ? 'badge-error' : 'badge-ghost'">
                  {{ g.messageCount }}
                </span>
                <div class="w-16 bg-base-content/8 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full bg-primary/60" :style="`width:${Math.min(100, (g.messageCount / limitVal) * 100)}%`"></div>
                </div>
              </div>
            </td>
            <td class="text-xs text-base-content/35">{{ formatDate(g.createdAt) }}</td>
            <td class="text-xs text-base-content/35">{{ formatDate(g.lastMessageAt) }}</td>
          </tr>
          <tr v-if="!data?.recentGuests?.length">
            <td colspan="4" class="text-center py-12 text-sm text-base-content/25">Belum ada guest session</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], ssr: false })

const api = useApi()

const { data, pending } = await useAsyncData('admin-guests-page',
  () => api.get<{ totalUsers: number; totalGuests: number; totalGuestMessages: number; recentGuests: any[] }>('/api/admin/guests'),
)

const { data: settings } = await useAsyncData('admin-settings-guest',
  () => api.get<Record<string, string>>('/api/admin/settings'),
)

const limitVal = computed(() => parseInt(settings.value?.guest_max_messages ?? '5', 10))

function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d))
}
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }
</style>
