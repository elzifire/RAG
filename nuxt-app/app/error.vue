<template>
  <div class="min-h-screen bg-base-100 font-sans overflow-x-hidden relative" data-theme="night">
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="absolute inset-0 bg-grid opacity-10"></div>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <main class="relative z-10 min-h-screen flex items-center justify-center px-6">
      <section class="w-full max-w-xl text-center">
        <span class="badge badge-outline border-warning/30 bg-warning/10 text-warning text-xs px-4 py-3 mb-6">
          Something Went Wrong
        </span>

        <h1 class="font-display font-black text-4xl md:text-5xl tracking-tight text-base-content mb-4">
          Oops, this page took a wrong turn.
        </h1>

        <p class="text-base md:text-lg text-base-content/55 leading-relaxed max-w-lg mx-auto mb-8">
          No worries. Please try again in a moment, or return to the home page while we keep things stable behind the scenes.
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <a href="/" class="btn btn-primary rounded-xl">Back to Home</a>
          <a href="/login" class="btn btn-ghost border border-base-content/15 rounded-xl">Go to Login</a>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }

.bg-grid {
  background-image:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 56px 56px;
}

.orb { position: absolute; border-radius: 9999px; filter: blur(100px); pointer-events: none; }
.orb-1 {
  width: 460px; height: 460px;
  background: oklch(var(--er) / 0.11);
  top: -130px; left: -100px;
  animation: orb-drift 18s ease-in-out infinite alternate;
}
.orb-2 {
  width: 360px; height: 360px;
  background: oklch(var(--wa) / 0.10);
  bottom: 110px; right: -90px;
  animation: orb-drift 24s ease-in-out infinite alternate-reverse;
}

@keyframes orb-drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(28px, 18px) scale(1.05); }
}
</style>
