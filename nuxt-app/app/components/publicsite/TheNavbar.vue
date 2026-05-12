<template>
  <header
    class="fixed top-0 inset-x-0 z-50 transition-all duration-500"
    :class="scrolled ? 'bg-base-100/95 backdrop-blur-xl border-b border-base-content/8 shadow-xl shadow-base-100/20' : 'bg-transparent'"
  >
    <nav class="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">

      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0 group">
        <div class="relative w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 group-hover:shadow-primary/50 group-hover:scale-105">
          <svg class="w-4 h-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <!-- glow ring -->
          <div class="absolute inset-0 rounded-xl ring-2 ring-primary/0 group-hover:ring-primary/30 transition-all duration-300"></div>
        </div>
        <span class="font-display font-extrabold text-lg tracking-tight text-base-content">
          RAG<span class="text-primary">Chat</span>
        </span>
      </NuxtLink>

      <!-- Center nav -->
      <div class="hidden md:flex items-center gap-1 mx-auto">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="relative px-4 py-2 rounded-lg text-sm text-base-content/50 hover:text-base-content transition-colors duration-200 group inline-flex items-center gap-2"
        >
          <span class="relative z-10">{{ link.label }}</span>
          <span
            v-if="link.comingSoon"
            class="badge badge-ghost badge-xs border border-warning/30 text-warning/80"
          >
            Coming Soon
          </span>
          <span class="absolute inset-0 rounded-lg bg-base-content/0 group-hover:bg-base-content/5 transition-colors duration-200"></span>
        </NuxtLink>
      </div>

      <!-- CTA -->
      <div class="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
        <NuxtLink to="/login" class="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content hidden sm:flex">
          Login
        </NuxtLink>
      

        <!-- Mobile menu button -->
        <button
          class="btn btn-ghost btn-sm md:hidden"
          @click="mobileOpen = !mobileOpen"
          aria-label="Toggle menu"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </nav>

    <!-- Mobile dropdown -->
    <Transition name="slide-down">
      <div
        v-if="mobileOpen"
        class="md:hidden bg-base-100/98 backdrop-blur-xl border-b border-base-content/8 px-6 pb-4"
      >
        <div class="flex flex-col gap-1 pt-2">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-4 py-3 rounded-xl text-sm text-base-content/60 hover:text-base-content hover:bg-base-content/5 transition-all flex items-center justify-between gap-2"
            @click="mobileOpen = false"
          >
            <span>{{ link.label }}</span>
            <span
              v-if="link.comingSoon"
              class="badge badge-ghost badge-xs border border-warning/30 text-warning/80"
            >
              Coming Soon
            </span>
          </NuxtLink>
          <div class="divider my-1"></div>
          <NuxtLink to="/login" class="btn btn-ghost btn-sm justify-start" @click="mobileOpen = false">Login</NuxtLink>
          <NuxtLink to="/login" class="btn btn-primary btn-sm" @click="mobileOpen = false">Get Started</NuxtLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
const mobileOpen = ref(false)

const navLinks = [
  { label: 'Features', to: '/publicsite/features', comingSoon: true },
  { label: 'Pricing', to: '/publicsite/pricing', comingSoon: true },
  { label: 'Docs', to: '/publicsite/docs', comingSoon: true },
  { label: 'Try Demo', to: '/try', comingSoon: false },
]

function onScroll() {
  scrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
