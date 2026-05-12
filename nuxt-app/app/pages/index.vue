<template>
  <div class="min-h-screen bg-base-100 font-sans overflow-x-hidden relative" data-theme="night">
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="absolute inset-0 bg-grid opacity-20"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <PublicsiteTheNavbar />

    <section class="relative z-10 pt-36 pb-16 px-6 text-center max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-2 badge badge-outline border-primary/30 bg-primary/8 text-primary text-xs mb-8 py-3 px-5 hover:bg-primary/12 transition-colors cursor-default">
        <span class="relative flex h-1.5 w-1.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
        </span>
        Powered by LangChain · RAG Architecture · v2.0
      </div>

      <h1 class="font-display font-black leading-[1.03] tracking-tight text-base-content mb-6">
        <span class="block text-5xl md:text-7xl">Ask anything.</span>
        <span class="block text-5xl md:text-7xl mt-1">
          <span class="text-gradient">Get grounded answers,</span>
        </span>
        <span class="block text-4xl md:text-6xl text-base-content/35 mt-1">not random guesses.</span>
      </h1>

      <p class="text-base md:text-lg text-base-content/45 max-w-xl mx-auto leading-relaxed mb-12">
        Chat with an AI assistant that cites sources and stays context-aware, all in one focused workspace.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-3 mb-14">
        <NuxtLink to="/login" class="btn btn-primary btn-lg gap-2.5 shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-0.5">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Start Free
        </NuxtLink>
        <NuxtLink to="/publicsite/features" class="btn btn-ghost btn-lg gap-2 text-base-content/50 hover:text-base-content border border-base-content/10 hover:border-base-content/20">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Explore Features
          <span class="badge badge-ghost badge-xs border border-warning/30 text-warning/80">Coming Soon</span>
        </NuxtLink>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-base-content/30">
        <div class="flex items-center gap-1.5">
          <div class="flex -space-x-2">
            <div v-for="(color, i) in avatarColors" :key="i" class="w-6 h-6 rounded-full bg-gradient-to-br ring-2 ring-base-100" :class="color"></div>
          </div>
          <span>2,400+ active users</span>
        </div>
        <span class="text-base-content/10">·</span>
        <div class="flex items-center gap-1">
          <span v-for="i in 5" :key="i" class="text-warning text-xs">★</span>
          <span class="ml-1">4.9 / 5 rating</span>
        </div>
        <span class="text-base-content/10">·</span>
        <span>No credit card required</span>
      </div>
    </section>

    <section class="relative z-10 px-4 pb-20 max-w-3xl mx-auto" id="demo">
      <div class="flex justify-center mb-6">
        <div class="inline-flex items-center gap-1 p-1 rounded-2xl bg-base-200/60 backdrop-blur-sm border border-base-content/8">
          <button
            v-for="tab in demoTabs"
            :key="tab.id"
            @click="!tab.comingSoon && (activeTab = tab.id)"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
              activeTab === tab.id
                ? 'bg-base-100 text-base-content shadow-lg shadow-base-100/50 scale-[1.02]'
                : 'text-base-content/40 hover:text-base-content/70',
              tab.comingSoon ? 'opacity-70 cursor-not-allowed' : ''
            ]"
          >
            <span class="text-base">{{ tab.emoji }}</span>
            <span class="hidden sm:inline">{{ tab.label }}</span>
            <span v-if="tab.comingSoon" class="badge badge-ghost badge-xs border border-warning/30 text-warning/80">
              Coming Soon
            </span>
          </button>
        </div>
      </div>

      <div class="demo-window rounded-2xl border border-base-content/10 bg-base-200/70 backdrop-blur-xl shadow-2xl shadow-base-100/40 overflow-hidden">
        <div class="flex items-center gap-3 px-5 py-3.5 border-b border-base-content/6 bg-base-200/80">
          <div class="flex gap-1.5 shrink-0">
            <span class="w-3 h-3 rounded-full bg-error/60"></span>
            <span class="w-3 h-3 rounded-full bg-warning/60"></span>
            <span class="w-3 h-3 rounded-full bg-success/60"></span>
          </div>
          <div class="flex-1 mx-4 flex items-center gap-2 bg-base-300/50 rounded-lg px-3 py-1.5 text-xs text-base-content/30">
            <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>app.ragchat.id/chat</span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="badge badge-xs badge-primary gap-1">
              <span class="w-1 h-1 rounded-full bg-primary-content/70 animate-pulse inline-block"></span>
              Live
            </span>
            <span class="text-xs text-base-content/30 hidden sm:inline">GPT-4o</span>
          </div>
        </div>

        <Transition name="tab-fade" mode="out-in">
          <div v-if="activeTab === 'chat'" key="chat" class="flex flex-col min-h-[440px]">
            <div class="flex-1 flex flex-col gap-5 px-6 py-6 overflow-hidden">
              <div class="chat chat-start anim-msg" style="animation-delay:0ms">
                <div class="chat-image">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-xs font-bold text-primary-content shadow-md shadow-primary/20">AI</div>
                </div>
                <div class="chat-bubble bg-primary/10 text-base-content/80 text-sm border border-primary/15 leading-relaxed max-w-sm">
                  Hey there! I am RAGChat. I answer with <strong class="text-primary">traceable sources</strong> so you can trust what you read.
                </div>
              </div>

              <div class="chat chat-end anim-msg" style="animation-delay:300ms">
                <div class="chat-bubble bg-base-content/8 text-base-content/70 text-sm leading-relaxed">
                  What makes RAG different from a normal chatbot?
                </div>
              </div>

              <div class="chat chat-start anim-msg" style="animation-delay:600ms">
                <div class="chat-image">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-xs font-bold text-primary-content shadow-md shadow-primary/20">AI</div>
                </div>
                <div class="flex flex-col gap-3 max-w-sm">
                  <div class="chat-bubble bg-primary/10 text-base-content/80 text-sm border border-primary/15 leading-relaxed">
                    <strong class="text-primary">RAG</strong> (Retrieval-Augmented Generation) combines document retrieval with generation. Instead of relying only on training memory, it pulls evidence from your sources first, then generates grounded answers.
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <div v-for="(src, i) in chatSources" :key="src.label" class="source-chip" :style="`animation-delay:${900+i*150}ms`">
                      <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {{ src.label }}
                      <span class="text-base-content/25 text-[10px]">p. {{ src.page }}</span>
                    </div>
                  </div>
                  <p class="text-xs text-base-content/25 pl-1">Verified using 3 references</p>
                </div>
              </div>

              <div class="chat chat-start anim-msg" style="animation-delay:1200ms">
                <div class="chat-image">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-xs font-bold text-primary-content shadow-md shadow-primary/20">AI</div>
                </div>
                <div class="chat-bubble bg-base-content/5 border border-base-content/8 px-4 py-3">
                  <div class="typing-dots flex gap-1 items-center">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-5 pb-5">
              <div class="flex items-center gap-3 bg-base-300/50 rounded-xl border border-base-content/10 px-4 py-3">
                <span class="text-sm text-base-content/25 flex-1">Type your question...</span>
                <div class="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div v-else key="coming-soon" class="flex flex-col min-h-[440px] p-8 items-center justify-center text-center">
            <span class="badge badge-outline border-warning/30 bg-warning/10 text-warning text-xs px-4 py-3 mb-5">
              Coming Soon
            </span>
            <h3 class="font-display font-bold text-2xl text-base-content mb-3">This demo mode is not live yet</h3>
            <p class="text-sm text-base-content/45 max-w-md leading-relaxed mb-6">
              PDF Analyzer and Knowledge Base are currently in development. Chat AI remains fully available.
            </p>
            <NuxtLink to="/publicsite/features" class="btn btn-ghost border border-base-content/12 rounded-xl">
              Learn more
            </NuxtLink>
          </div>
        </Transition>
      </div>

      <p class="text-center text-xs text-base-content/20 mt-4">Interactive demo · No data is stored</p>
    </section>

    <section class="relative z-10 border-y border-base-content/6 bg-base-200/20 backdrop-blur-sm">
      <div class="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-base-content/6">
        <div v-for="stat in stats" :key="stat.label" class="group py-10 text-center hover:bg-base-content/3 transition-colors cursor-default">
          <p class="font-display font-black text-3xl md:text-4xl text-base-content tracking-tight group-hover:text-primary transition-colors">{{ stat.value }}</p>
          <p class="text-xs text-base-content/30 mt-2">{{ stat.label }}</p>
        </div>
      </div>
    </section>

    <section class="relative z-10 py-24 px-6 max-w-5xl mx-auto">
      <div class="text-center mb-14">
        <p class="text-xs uppercase tracking-widest text-primary/60 mb-3 font-semibold">Why RAGChat</p>
        <h2 class="font-display font-bold text-3xl md:text-4xl text-base-content tracking-tight mb-4">Built for trustworthy answers</h2>
        <p class="text-base-content/40 text-sm max-w-md mx-auto">A clean path from question to evidence, so decisions are faster and safer.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          v-for="feat in features"
          :key="feat.title"
          class="group relative p-6 rounded-2xl border border-base-content/8 bg-base-content/2 hover:bg-base-content/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5 cursor-default overflow-hidden"
        >
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300"></div>
          <div class="relative z-10">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-5 transition-transform duration-300 group-hover:scale-110" :class="feat.iconBg">{{ feat.icon }}</div>
            <h3 class="text-sm font-semibold text-base-content mb-2">{{ feat.title }}</h3>
            <p class="text-xs text-base-content/40 leading-relaxed">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="relative z-10 px-4 pb-24 max-w-4xl mx-auto">
      <div class="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-base-200/60 to-secondary/8 p-8 md:p-12">
        <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-secondary/10 blur-[60px] pointer-events-none"></div>
        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div class="max-w-md">
            <div class="badge badge-primary badge-outline text-xs mb-4 py-2.5 px-4">Admin Tools</div>
            <h3 class="font-display font-bold text-2xl md:text-3xl text-base-content mb-3 leading-tight">Expert Knowledge Integration</h3>
            <p class="text-sm text-base-content/45 leading-relaxed">Admins can manage domain-specific knowledge with semantic retrieval and controlled access flows.</p>
            <ul class="mt-5 flex flex-col gap-2">
              <li v-for="item in adminFeatures" :key="item" class="flex items-center gap-2.5 text-xs text-base-content/50">
                <svg class="w-4 h-4 text-primary/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="flex flex-col gap-3 shrink-0">
            <NuxtLink to="/login" class="btn btn-primary gap-2 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow hover:-translate-y-0.5">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Start Free
            </NuxtLink>
            <NuxtLink to="/publicsite/docs" class="btn btn-outline btn-sm rounded-xl gap-2 border-primary/30 text-primary/70 hover:bg-primary/10 hover:border-primary/50">
              Documentation
              <span class="badge badge-ghost badge-xs border border-warning/30 text-warning/80">Coming Soon</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <PublicsiteTheFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const demoTabs = [
  { id: 'chat', label: 'Chat AI', emoji: '💬', comingSoon: false },
  { id: 'pdf', label: 'PDF Analyzer', emoji: '📄', comingSoon: true },
  { id: 'kb', label: 'Knowledge Base', emoji: '📚', comingSoon: true },
]
const activeTab = ref('chat')

const chatSources = [
  { label: 'LangChain Docs', page: 14 },
  { label: 'RAG Survey 2024', page: 7 },
  { label: 'OpenAI Blog', page: 3 },
]

const stats = [
  { value: '10x', label: 'Faster than manual search' },
  { value: '99%', label: 'Source-grounded responses' },
  { value: '∞', label: 'Scalable content coverage' },
]

const features = [
  { title: 'Semantic Retrieval', desc: 'Find the most relevant evidence from large corpora using embeddings, not fragile keyword matching.', icon: '🔍', iconBg: 'bg-primary/15' },
  { title: 'Expert Knowledge Base', desc: 'Organize and maintain domain-specific sources with clear ownership and quality controls.', icon: '🧠', iconBg: 'bg-secondary/15' },
  { title: 'Transparent Citations', desc: 'Every answer can point to source context so users can verify quickly and confidently.', icon: '📌', iconBg: 'bg-warning/15' },
]

const adminFeatures = [
  'Bulk upload and indexing',
  'Multilingual semantic retrieval',
  'Incremental content updates',
  'Granular access control',
]

const avatarColors = [
  'from-primary/80 to-primary/40',
  'from-secondary/80 to-secondary/40',
  'from-warning/80 to-warning/40',
  'from-accent/80 to-accent/40',
]
</script>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }

.bg-grid {
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}

.orb { position: absolute; border-radius: 9999px; filter: blur(100px); pointer-events: none; }
.orb-1 {
  width: 600px; height: 600px;
  background: oklch(var(--p) / 0.12);
  top: -200px; left: -150px;
  animation: orb-drift 18s ease-in-out infinite alternate;
}
.orb-2 {
  width: 400px; height: 400px;
  background: oklch(var(--s) / 0.10);
  top: 40%; right: -100px;
  animation: orb-drift 22s ease-in-out infinite alternate-reverse;
}
.orb-3 {
  width: 300px; height: 300px;
  background: oklch(var(--a) / 0.08);
  bottom: 100px; left: 30%;
  animation: orb-drift 26s ease-in-out infinite alternate;
}

@keyframes orb-drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(40px, 30px) scale(1.08); }
}

.text-gradient {
  background: linear-gradient(135deg, oklch(var(--p)) 0%, oklch(var(--s)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.demo-window { position: relative; }
.demo-window::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  background: linear-gradient(135deg, oklch(var(--p) / 0.25), transparent 55%, oklch(var(--s) / 0.15));
  z-index: -1;
}

.anim-msg { animation: msg-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes msg-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.typing-dots span {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 9999px;
  background: oklch(var(--bc) / 0.35);
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); background: oklch(var(--p) / 0.7); }
}

.source-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  background: oklch(var(--b3) / 0.6);
  border: 1px solid oklch(var(--bc) / 0.1);
  border-radius: 8px;
  padding: 5px 10px;
  color: oklch(var(--bc) / 0.5);
  cursor: default;
  animation: chip-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transition: border-color 0.2s, color 0.2s;
}
.source-chip:hover {
  border-color: oklch(var(--p) / 0.35);
  color: oklch(var(--p) / 0.8);
}

@keyframes chip-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.tab-fade-enter-active, .tab-fade-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.tab-fade-enter-from { opacity: 0; transform: translateY(10px) scale(0.99); }
.tab-fade-leave-to { opacity: 0; transform: translateY(-6px) scale(0.99); }
</style>
