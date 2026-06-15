<script>
import { AuthenticationService } from '../../services/authentication.service.js';

export default {
  name: "ForgotPasswordPage",
  data() {
    return {
      email: '',
      loading: false,
      authService: new AuthenticationService(),
    };
  },
  methods: {
    async submit() {
      this.loading = true;
      try {
        await this.authService.forgotPassword(this.email);
      } catch {
        // Intentionally swallowed — anti-enumeration: same message regardless of outcome
      } finally {
        this.loading = false;
        this.$toast.add({
          severity: 'info',
          summary: this.$t('iam.forgotPassword.toastSummary'),
          detail: this.$t('iam.forgotPassword.genericMessage'),
          life: 8000,
        });
      }
    },
    goToLogin() {
      this.$router.push({ name: 'login' });
    },
  },
};
</script>

<template>
  <div class="activate-container">
    <pv-toast />
    <div class="activate-card">
      <div class="state-content">
        <i class="pi pi-lock" style="font-size: 3rem; color: #34a7c1;"></i>
        <h2 class="activate-title">{{ $t('iam.forgotPassword.title') }}</h2>

        <form class="forgot-form" @submit.prevent="submit">
          <pv-input-text
            v-model="email"
            :placeholder="$t('iam.forgotPassword.emailPlaceholder')"
            type="email"
            required
            class="forgot-input"
            autocomplete="email"
          />
          <pv-button
            :loading="loading"
            :label="$t('iam.forgotPassword.submitButton')"
            type="submit"
            class="activate-button"
          />
        </form>

        <pv-button
          :label="$t('iam.forgotPassword.backToLogin')"
          icon="pi pi-arrow-left"
          class="activate-button"
          severity="secondary"
          @click="goToLogin"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.activate-container {
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: stretch;
  min-height: calc(100vh - 40px);
  margin: -20px;
  padding: 20px;
  background-color: #f7fafc;
}

.activate-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 60px 40px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.activate-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.forgot-input {
  width: 100%;
}

.activate-button {
  margin-top: 8px;
  min-width: 200px;
  border-radius: 12px;
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  border: none;
}

.activate-button:hover:not(:disabled) {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
}

@media (max-width: 600px) {
  .activate-card {
    padding: 40px 24px;
  }

  .activate-title {
    font-size: 1.5rem;
  }
}
</style>
