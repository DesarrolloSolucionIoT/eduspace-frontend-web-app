<script>
import { AuthenticationService } from '../../services/authentication.service.js';

export default {
  name: "ActivatePage",
  data() {
    return {
      state: 'loading',
      authService: new AuthenticationService(),
    };
  },
  async created() {
    const token = this.$route.query.token;

    if (!token) {
      this.state = 'error-missing-token';
      return;
    }

    this.state = 'loading';

    try {
      await this.authService.activate(token);
      this.state = 'success';
    } catch (error) {
      const code = error?.response?.data?.code;

      if (error?.response?.status === 400) {
        if (code === 'TokenExpired') {
          this.state = 'error-expired';
        } else if (code === 'TokenAlreadyUsed') {
          this.state = 'error-used';
        } else {
          this.state = 'error-invalid';
        }
      } else {
        this.state = 'error-invalid';
      }
    }
  },
  methods: {
    goToLogin() {
      this.$router.push({ name: 'login' });
    },
  },
};
</script>

<template>
  <div class="activate-container">
    <div class="activate-card">
      <!-- Loading -->
      <div v-if="state === 'loading'" class="state-content">
        <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: #34a7c1;"></i>
        <h2 class="activate-title">Activando tu cuenta...</h2>
        <p class="activate-description">Por favor espera un momento.</p>
      </div>

      <!-- Success -->
      <div v-if="state === 'success'" class="state-content">
        <i class="pi pi-check-circle" style="font-size: 3rem; color: #48bb78;"></i>
        <h2 class="activate-title">¡Cuenta activada!</h2>
        <p class="activate-description">Ya puedes iniciar sesión con tus credenciales.</p>
        <pv-button
          label="Iniciar sesión"
          icon="pi pi-sign-in"
          class="activate-button"
          @click="goToLogin"
        />
      </div>

      <!-- Error: missing token -->
      <div v-if="state === 'error-missing-token'" class="state-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: #f6ad55;"></i>
        <h2 class="activate-title">Link inválido</h2>
        <p class="activate-description">El link de activación es inválido o está incompleto.</p>
        <pv-button
          label="Volver al inicio de sesión"
          icon="pi pi-arrow-left"
          class="activate-button"
          severity="secondary"
          @click="goToLogin"
        />
      </div>

      <!-- Error: expired token -->
      <div v-if="state === 'error-expired'" class="state-content">
        <i class="pi pi-clock" style="font-size: 3rem; color: #f6ad55;"></i>
        <h2 class="activate-title">Link expirado</h2>
        <p class="activate-description">El link expiró. Pídele a tu administrador que te envíe uno nuevo.</p>
        <pv-button
          label="Volver al inicio de sesión"
          icon="pi pi-arrow-left"
          class="activate-button"
          severity="secondary"
          @click="goToLogin"
        />
      </div>

      <!-- Error: already used -->
      <div v-if="state === 'error-used'" class="state-content">
        <i class="pi pi-info-circle" style="font-size: 3rem; color: #63b3ed;"></i>
        <h2 class="activate-title">Link ya utilizado</h2>
        <p class="activate-description">Este link ya fue usado. Si ya activaste tu cuenta, puedes iniciar sesión.</p>
        <pv-button
          label="Iniciar sesión"
          icon="pi pi-sign-in"
          class="activate-button"
          @click="goToLogin"
        />
      </div>

      <!-- Error: invalid token -->
      <div v-if="state === 'error-invalid'" class="state-content">
        <i class="pi pi-times-circle" style="font-size: 3rem; color: #f56565;"></i>
        <h2 class="activate-title">Link inválido</h2>
        <p class="activate-description">El link de activación es inválido.</p>
        <pv-button
          label="Volver al inicio de sesión"
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
  /* Escape the 20px padding that .main-content adds on all sides AND its
     align-items: center (which would otherwise shrink us to content width)
     so the gray background covers the entire visible area edge-to-edge. */
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
