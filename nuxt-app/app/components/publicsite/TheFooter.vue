<template>
  <footer class="relative z-10 mt-auto border-t border-base-content/8 bg-base-200/30 backdrop-blur-sm">

    <!-- Top section -->
    <div class="max-w-6xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-5 gap-10">

      <!-- Brand column -->
      <div class="md:col-span-2 flex flex-col gap-5">
        <!-- Logo -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
            <svg class="w-4 h-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </div>
          <span class="font-display font-extrabold text-lg tracking-tight text-base-content">
            RAG<span class="text-primary">Chat</span>
          </span>
        </div>

        <!-- Tagline -->
        <p class="text-sm text-base-content/45 leading-relaxed max-w-xs">
          Platform AI berbasis Retrieval-Augmented Generation. Jawaban akurat, sumber transparan — bukan sekadar tebakan.
        </p>

        <!-- Tech badges -->
        <div class="flex flex-wrap gap-2">
          <span v-for="tech in techStack" :key="tech" class="badge badge-ghost text-xs border border-base-content/8 text-base-content/40 px-2.5 py-1.5">
            {{ tech }}
          </span>
        </div>

        <!-- Status indicator -->
        <div class="flex items-center gap-2 text-xs text-base-content/35">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          Semua sistem berjalan normal
        </div>
      </div>

      <!-- Link columns -->
      <div
        v-for="col in footerLinks"
        :key="col.heading"
        class="flex flex-col gap-4"
      >
        <h4 class="text-xs font-semibold uppercase tracking-widest text-base-content/30">{{ col.heading }}</h4>
        <ul class="flex flex-col gap-2.5">
          <li v-for="link in col.links" :key="link.label">
            <NuxtLink
              :to="link.to"
              class="text-sm text-base-content/45 hover:text-primary transition-colors duration-200 flex items-center gap-1.5 group"
            >
              {{ link.label }}
              <span
                v-if="link.comingSoon"
                class="badge badge-ghost badge-xs border border-warning/30 text-warning/80"
              >
                Coming Soon
              </span>
              <svg v-if="link.external" class="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-base-content/5 max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p class="text-xs text-base-content/25">
        © {{ currentYear }} RAGChat. Dibuat dengan ❤️ di Indonesia.
      </p>

      <!-- Social links -->
      <div class="flex items-center gap-3">
        <a
          v-for="social in socialLinks"
          :key="social.label"
          :href="social.href"
          target="_blank"
          rel="noopener noreferrer"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-base-content/30 hover:text-base-content/70 hover:bg-base-content/8 transition-all duration-200"
          :aria-label="social.label"
        >
          <component :is="social.icon" class="w-4 h-4" />
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

const currentYear = computed(() => new Date().getFullYear())

const techStack = ['LangChain', 'RAG', 'Nuxt 4', 'Prisma', 'Redis', 'PostgreSQL']

const footerLinks = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', to: '/publicsite/features', comingSoon: true },
      { label: 'Pricing', to: '/publicsite/pricing', comingSoon: true },
      { label: 'Changelog', to: '#' },
      { label: 'Roadmap', to: '#' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'Documentation', to: '/publicsite/docs', comingSoon: true },
      { label: 'API Reference', to: '#', external: true },
      { label: 'GitHub', to: '#', external: true },
      { label: 'Status', to: '#', external: true },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Tentang', to: '#' },
      { label: 'Blog', to: '#' },
      { label: 'Privasi', to: '#' },
      { label: 'Ketentuan', to: '#' },
    ],
  },
]

// Inline SVG icon components
const IconGithub = defineComponent({
  render: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { d: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' })
  ])
})

const IconTwitter = defineComponent({
  render: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' })
  ])
})

const IconLinkedin = defineComponent({
  render: () => h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' })
  ])
})

const socialLinks = [
  { label: 'GitHub', href: '#', icon: IconGithub },
  { label: 'Twitter / X', href: '#', icon: IconTwitter },
  { label: 'LinkedIn', href: '#', icon: IconLinkedin },
]
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }
</style>
