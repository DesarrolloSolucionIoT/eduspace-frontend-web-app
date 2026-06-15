<script>
import { AuthenticationService } from '../../services/authentication.service.js';

export default {
  name: "ResetPasswordPage",
  data() {
    return {
      state: 'idle',
      newPassword: '',
      confirmPassword: '',
      validationError: '',
      token: null,
      authService: new AuthenticationService(),
    };
  },
  created() {
    const token = this.$route.query.token;
    if (!token) {
      this.state = 'error-missing-token';
      return;
    }
    this.token = token;
  },
  methods: {
    async submit() {
      this.validationError = '';

      if (this.newPassword !== this.confirmPassword) {
        this.validationError = this.$t('iam.resetPassword.passwordMismatch');
        return;
      }

      this.state = 'loading';

      try {
        await this.authService.resetPassword(this.token, this.newPassword);
        this.state = 'success';
      } catch (error) {
        const code = error?.response?.data?.code;

        if (error?.response?.status === 400) {
          if (code === 'PasswordResetTokenExpired') {
            this.state = 'error-expired';
          } else if (code === 'PasswordResetTokenAlreadyUsed') {
            this.state = 'error-used';
          } else {
            this.state = 'error-invalid';
          }
        } else {
          this.state = 'error-server';
        }
      }
    },
    retry() {
      this.state = 'idle';
    },
    goToLogin() {
      this.$router.push({ name: 'login' });
    },
  },
};
</script>

<template>
  <div class="activate-container">
    <div class="activate-card">
      <!-- Idle: form -->
      <div v-if="state === 'idle'" class="state-content">
        <i class="pi pi-key" style="font-size: 3rem; color: #34a7c1;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.title') }}</h2>

        <form class="reset-form" @submit.prevent="submit">
          <pv-password
            v-model="newPassword"
            :placeholder="$t('iam.resetPassword.newPasswordPlaceholder')"
            toggleMask
            required
            class="reset-input"
            inputClass="w-full"
            :feedback="false"
            autocomplete="new-password"
          />
          <pv-password
            v-model="confirmPassword"
            :placeholder="$t('iam.resetPassword.confirmPasswordPlaceholder')"
            toggleMask
            required
            class="reset-input"
            inputClass="w-full"
            :feedback="false"
            autocomplete="new-password"
          />
          <small v-if="validationError" class="validation-error">{{ validationError }}</small>
          <pv-button
            :label="$t('iam.resetPassword.submitButton')"
            type="submit"
            class="activate-button"
          />
        </form>
      </div>

      <!-- Loading -->
      <div v-if="state === 'loading'" class="state-content">
        <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: #34a7c1;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.loading') }}</h2>
      </div>

      <!-- Success -->
      <div v-if="state === 'success'" class="state-content">
        <i class="pi pi-check-circle" style="font-size: 3rem; color: #48bb78;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.successTitle') }}</h2>
        <p class="activate-description">{{ $t('iam.resetPassword.successDescription') }}</p>
        <pv-button
          :label="$t('iam.resetPassword.backToLogin')"
          icon="pi pi-sign-in"
          class="activate-button"
          @click="goToLogin"
        />
      </div>

      <!-- Error: missing token -->
      <div v-if="state === 'error-missing-token'" class="state-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: #f6ad55;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.errorMissingTokenTitle') }}</h2>
        <p class="activate-description">{{ $t('iam.resetPassword.errorMissingTokenDescription') }}</p>
        <pv-button
          :label="$t('iam.resetPassword.backToLogin')"
          icon="pi pi-arrow-left"
          class="activate-button"
          severity="secondary"
          @click="goToLogin"
        />
      </div>

      <!-- Error: expired token -->
      <div v-if="state === 'error-expired'" class="state-content">
        <i class="pi pi-clock" style="font-size: 3rem; color: #f6ad55;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.errorExpiredTitle') }}</h2>
        <p class="activate-description">{{ $t('iam.resetPassword.errorExpiredDescription') }}</p>
        <pv-button
          :label="$t('iam.resetPassword.backToLogin')"
          icon="pi pi-arrow-left"
          class="activate-button"
          severity="secondary"
          @click="goToLogin"
        />
      </div>

      <!-- Error: already used -->
      <div v-if="state === 'error-used'" class="state-content">
        <i class="pi pi-info-circle" style="font-size: 3rem; color: #63b3ed;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.errorUsedTitle') }}</h2>
        <p class="activate-description">{{ $t('iam.resetPassword.errorUsedDescription') }}</p>
        <pv-button
          :label="$t('iam.resetPassword.backToLogin')"
          icon="pi pi-sign-in"
          class="activate-button"
          @click="goToLogin"
        />
      </div>

      <!-- Error: server / network -->
      <div v-if="state === 'error-server'" class="state-content">
        <i class="pi pi-exclamation-circle" style="font-size: 3rem; color: #f6ad55;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.errorServerTitle') }}</h2>
        <p class="activate-description">{{ $t('iam.resetPassword.errorServerDescription') }}</p>
        <pv-button
          :label="$t('iam.resetPassword.retry')"
          icon="pi pi-refresh"
          class="activate-button"
          @click="retry"
        />
      </div>

      <!-- Error: invalid token -->
      <div v-if="state === 'error-invalid'" class="state-content">
        <i class="pi pi-times-circle" style="font-size: 3rem; color: #f56565;"></i>
        <h2 class="activate-title">{{ $t('iam.resetPassword.errorInvalidTitle') }}</h2>
        <p class="activate-description">{{ $t('iam.resetPassword.errorInvalidDescription') }}</p>
        <pv-button
          :label="$t('iam.resetPassword.backToLogin')"
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

.activate-description {
  color: #718096;
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.reset-input {
  width: 100%;
}

.reset-input :deep(.p-inputtext),
.reset-input :deep(.p-password),
.reset-input :deep(.p-password-input) {
  width: 100%;
}

.validation-error {
  color: #f56565;
  font-size: 0.875rem;
  text-align: left;
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
