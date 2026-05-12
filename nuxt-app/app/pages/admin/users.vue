<template>
  <div class="ui-admin-page space-y-5">

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg text-sm"
        :class="toast.type === 'error'
          ? 'bg-error/10 border-error/20 text-error'
          : 'bg-success/10 border-success/20 text-success'"
      >
        <svg v-if="toast.type === 'error'" class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <svg v-else class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ toast.message }}
      </div>
    </Transition>

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="font-display font-bold text-2xl text-base-content">Pengguna</h1>
        <p class="text-sm text-base-content/40 mt-1">Kelola semua pengguna terdaftar</p>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama / email…"
          class="input input-sm rounded-xl border-base-content/10 bg-base-200/60 focus:border-primary/40 w-52"
        />
        <button class="btn btn-primary btn-sm rounded-xl gap-1.5" @click="openCreate">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Tambah
        </button>
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
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Pengguna</th>
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Role</th>
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3">Bergabung</th>
            <th class="text-xs font-semibold uppercase tracking-widest text-base-content/30 py-3 w-24 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="border-base-content/5 hover:bg-base-content/2 transition-colors"
          >
            <td class="py-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary/70 to-secondary/70 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-medium text-base-content/80">{{ user.name }}</p>
                  <p class="text-xs text-base-content/35">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td>
              <span class="badge badge-xs" :class="user.role === 'ADMIN' ? 'badge-warning' : 'badge-ghost'">
                {{ user.role }}
              </span>
            </td>
            <td class="text-xs text-base-content/35">{{ formatDate(user.createdAt) }}</td>
            <td class="text-right">
              <div class="flex justify-end gap-1">
                <button class="btn btn-ghost btn-xs rounded-lg w-7 h-7 min-h-0 p-0 text-base-content/40 hover:text-primary hover:bg-primary/8" @click="openEdit(user)" title="Edit">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button class="btn btn-ghost btn-xs rounded-lg w-7 h-7 min-h-0 p-0 text-base-content/40 hover:text-error hover:bg-error/8" @click="openDelete(user)" title="Hapus">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredUsers.length">
            <td colspan="4" class="text-center py-12 text-sm text-base-content/25">Tidak ada pengguna ditemukan</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── Create / Edit Modal ── -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showFormModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="showFormModal = false"
      >
        <div class="bg-base-200 border border-base-content/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
          <div class="px-6 pt-6 pb-4 border-b border-base-content/8 flex items-center justify-between">
            <h2 class="font-display font-bold text-lg text-base-content">
              {{ editMode ? 'Edit Pengguna' : 'Tambah Pengguna' }}
            </h2>
            <button class="btn btn-ghost btn-sm rounded-xl w-8 h-8 min-h-0 p-0 text-base-content/40" @click="showFormModal = false">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <label class="form-control">
              <div class="label py-0 pb-1"><span class="label-text text-xs text-base-content/50">Nama</span></div>
              <input v-model="form.name" type="text" placeholder="Nama lengkap" class="input input-sm rounded-xl border-base-content/10 bg-base-100/50 focus:border-primary/40"/>
            </label>
            <label class="form-control">
              <div class="label py-0 pb-1"><span class="label-text text-xs text-base-content/50">Email</span></div>
              <input v-model="form.email" type="email" placeholder="email@contoh.com" class="input input-sm rounded-xl border-base-content/10 bg-base-100/50 focus:border-primary/40"/>
            </label>
            <label class="form-control">
              <div class="label py-0 pb-1">
                <span class="label-text text-xs text-base-content/50">Password</span>
                <span v-if="editMode" class="label-text-alt text-xs text-base-content/25">Kosongkan jika tidak diubah</span>
              </div>
              <input v-model="form.password" type="password" placeholder="Min. 8 karakter" class="input input-sm rounded-xl border-base-content/10 bg-base-100/50 focus:border-primary/40"/>
            </label>
            <label class="form-control">
              <div class="label py-0 pb-1"><span class="label-text text-xs text-base-content/50">Role</span></div>
              <select v-model="form.role" class="select select-sm rounded-xl border-base-content/10 bg-base-100/50 focus:border-primary/40">
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <p v-if="formError" class="text-xs text-error">{{ formError }}</p>
          </div>
          <div class="px-6 pb-6 flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm rounded-xl" @click="showFormModal = false">Batal</button>
            <button class="btn btn-primary btn-sm rounded-xl min-w-24" :disabled="saving" @click="submitForm">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ editMode ? 'Simpan' : 'Tambah' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirmation Modal ── -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="showDeleteModal = false"
      >
        <div class="bg-base-200 border border-base-content/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div class="px-6 pt-6 pb-4 border-b border-base-content/8">
            <h2 class="font-display font-bold text-lg text-base-content">Hapus Pengguna</h2>
          </div>
          <div class="px-6 py-5">
            <p class="text-sm text-base-content/60">
              Yakin ingin menghapus <span class="font-semibold text-base-content">{{ deleteTarget?.name }}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div class="px-6 pb-6 flex justify-end gap-2">
            <button class="btn btn-ghost btn-sm rounded-xl" @click="showDeleteModal = false">Batal</button>
            <button class="btn btn-error btn-sm rounded-xl min-w-24" :disabled="saving" @click="confirmDelete">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              <span v-else>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'], ssr: false })

interface UserRow { id: string; name: string; email: string; role: string; createdAt: string }

const api = useApi()
const search = ref('')
const saving = ref(false)
const formError = ref('')

// ── Data ─────────────────────────────────────────────────────────────────────
const { data: users, pending, refresh } = await useAsyncData('admin-users',
  () => api.get<UserRow[]>('/api/admin/users'),
)

const filteredUsers = computed(() => {
  if (!users.value) return []
  const q = search.value.toLowerCase()
  return users.value.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

// ── Toast ────────────────────────────────────────────────────────────────────
const toast = reactive({ show: false, type: 'success' as 'success' | 'error', message: '' })
let toastTimer: ReturnType<typeof setTimeout>

function showToast(message: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  toast.show = true
  toast.type = type
  toast.message = message
  toastTimer = setTimeout(() => { toast.show = false }, 3500)
}

// ── Create / Edit form ───────────────────────────────────────────────────────
const showFormModal = ref(false)
const editMode = ref(false)
const editId = ref('')
const form = reactive({ name: '', email: '', password: '', role: 'USER' })

function openCreate() {
  editMode.value = false
  editId.value = ''
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'USER'
  formError.value = ''
  showFormModal.value = true
}

function openEdit(user: UserRow) {
  editMode.value = true
  editId.value = user.id
  form.name = user.name
  form.email = user.email
  form.password = ''
  form.role = user.role
  formError.value = ''
  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''

  if (!form.name.trim() || !form.email.trim()) {
    formError.value = 'Nama dan email wajib diisi'
    return
  }
  if (!editMode.value && !form.password.trim()) {
    formError.value = 'Password wajib diisi untuk pengguna baru'
    return
  }
  if (form.password && form.password.length < 8) {
    formError.value = 'Password minimal 8 karakter'
    return
  }

  saving.value = true
  try {
    if (editMode.value) {
      const body: Record<string, string> = { name: form.name, email: form.email, role: form.role }
      if (form.password) body.password = form.password
      await api.patch<UserRow>(`/api/admin/users/${editId.value}`, body)
    } else {
      await api.post<UserRow>('/api/admin/users', {
        name: form.name, email: form.email, password: form.password, role: form.role,
      })
    }
    showFormModal.value = false
    await refresh()
    showToast(editMode.value ? 'Pengguna berhasil diperbarui' : 'Pengguna berhasil ditambahkan')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    formError.value = err?.data?.message ?? 'Terjadi kesalahan'
  } finally {
    saving.value = false
  }
}

// ── Delete ───────────────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deleteTarget = ref<UserRow | null>(null)

function openDelete(user: UserRow) {
  deleteTarget.value = user
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await api.del(`/api/admin/users/${deleteTarget.value.id}`)
    showDeleteModal.value = false
    deleteTarget.value = null
    await refresh()
    showToast('Pengguna berhasil dihapus')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    showToast(err?.data?.message ?? 'Gagal menghapus pengguna', 'error')
    showDeleteModal.value = false
  } finally {
    saving.value = false
  }
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(d))
}
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }

.modal-enter-active { transition: opacity 0.2s; }
.modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.toast-enter-active { transition: opacity 0.2s, transform 0.2s; }
.toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from  { opacity: 0; transform: translateY(8px); }
.toast-leave-to    { opacity: 0; transform: translateY(4px); }
</style>

