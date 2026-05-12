<template>
  <div class="min-h-screen bg-base-100 font-sans overflow-x-hidden relative" data-theme="night">
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="absolute inset-0 bg-grid opacity-15"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <PublicsiteTheNavbar />

    <section class="relative z-10 pt-36 pb-20 px-6 max-w-3xl mx-auto text-center">
      <span class="badge badge-outline border-warning/30 bg-warning/10 text-warning text-xs px-4 py-3 mb-8">
        Coming Soon
      </span>

      <h1 class="font-display font-black text-5xl md:text-6xl tracking-tight text-base-content mb-5">
        This Section
      </h1>

      <p class="text-base md:text-lg text-base-content/50 max-w-xl mx-auto leading-relaxed mb-8">
        This page is not live yet. We are polishing the experience so it ships with a high-quality release.
      </p>

      <div class="rounded-2xl border border-base-content/10 bg-base-200/50 p-6 max-w-xl mx-auto mb-10">
        <p class="text-sm text-base-content/55 leading-relaxed">
          Thanks for checking this out early. For now, you can keep using Chat AI and the core dashboard without interruption.
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <NuxtLink to="/" class="btn btn-primary gap-2 rounded-xl shadow-lg shadow-primary/25">
          Back to Home
        </NuxtLink>
        <NuxtLink to="/login" class="btn btn-ghost border border-base-content/12 rounded-xl">
          Go to Login
        </NuxtLink>
      </div>
    </section>

    <PublicsiteTheFooter />
  </div>
</template>

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
  width: 460px; height: 460px;
  background: oklch(var(--wa) / 0.10);
  top: -140px; left: -100px;
  animation: orb-drift 20s ease-in-out infinite alternate;
}
.orb-2 {
  width: 360px; height: 360px;
  background: oklch(var(--p) / 0.08);
  bottom: 120px; right: -80px;
  animation: orb-drift 24s ease-in-out infinite alternate-reverse;
}

@keyframes orb-drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(30px, 20px) scale(1.05); }
}
</style>
