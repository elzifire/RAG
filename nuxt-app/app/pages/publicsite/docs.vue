<template>
  <div class="min-h-screen bg-base-100 font-sans" data-theme="night">
    <PublicsiteTheNavbar />
    <section class="pt-36 pb-20 px-6 max-w-3xl mx-auto text-center">
      <span class="badge badge-outline border-warning/30 bg-warning/10 text-warning text-xs px-4 py-3 mb-8">
        Coming Soon
      </span>
      <h1 class="font-display font-black text-5xl md:text-6xl tracking-tight text-base-content mb-5">
        Documentation
      </h1>
      <p class="text-base md:text-lg text-base-content/50 max-w-xl mx-auto leading-relaxed mb-8">
        We are preparing complete docs for setup, deployment, and best practices.
      </p>
      <NuxtLink to="/login" class="btn btn-primary rounded-xl">Go to Login</NuxtLink>
    </section>
    <PublicsiteTheFooter />
  </div>
</template>

<style scoped>
.font-display { font-family: 'Syne', sans-serif; }
</style>
