<script>
export default {
  name: 'NotFoundPage',
  computed: {
    homeRoute() {
      const isAuth = this.$store.getters['user/isAuthenticated'];
      const role = this.$store.getters['user/userRole'];
      if (!isAuth) return { name: 'login' };
      if (role === 'RoleAdmin') return { name: 'home-admin' };
      return { name: 'login' };
    },
  },
};
</script>

<template>
  <main class="not-found">
    <div class="not-found__panel">
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">{{ $t('shared.notFound.title') }}</h1>
      <p class="not-found__message">
        {{ $t('shared.notFound.routePrefix') }} <code>{{ $route.fullPath }}</code> {{ $t('shared.notFound.routeSuffix') }}
      </p>
      <router-link :to="homeRoute" custom v-slot="{ navigate }">
        <pv-button :label="$t('shared.notFound.backHome')" icon="pi pi-home" @click="navigate" />
      </router-link>
    </div>
  </main>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: var(--surface-ground, #f8fafc);
}
.not-found__panel {
  max-width: 32rem;
  text-align: center;
}
.not-found__code {
  font-size: 4rem;
  font-weight: 700;
  margin: 0;
  color: var(--primary-color, #4f46e5);
  letter-spacing: 0.05em;
}
.not-found__title {
  font-size: 1.5rem;
  margin: 0.25rem 0 0.75rem;
}
.not-found__message {
  margin-bottom: 1.5rem;
  color: var(--text-color-secondary, #475569);
}
.not-found__message code {
  background: var(--surface-100, #e2e8f0);
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}
</style>
