<script>
import LoginForm from '../../login/components/login-form.component.vue';
import RegisterForm from '../../register/components/register-form.component.vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import { SignInRequest } from '../../model/sign-in.request.js';
import { SignUpRequest } from '../../model/sign-up.request.js';
import RegisterService from '../../register/services/register.services.js';

export default {
  name: "AuthSplitScreen",
  components: { LoginForm, RegisterForm },

  data() {
    return {
      mode: 'signin',          // 'signin' | 'signup'
      isLoggingIn: false,
      registrationError: null,
      signInRequest: new SignInRequest({}),
    };
  },

  computed: {
    ...mapState("user", {
      userId: "id",
      userToken: "token",
    }),
    ...mapGetters("user", ["userRole"]),
  },

  watch: {
    '$route.name': {
      immediate: true,
      handler(name) {
        this.mode = name === 'register' ? 'signup' : 'signin';
      },
    },
  },

  methods: {
    ...mapActions("user", ["signIn"]),

    goToSignUp() {
      this.$router.push({ name: 'register' });
    },

    goToSignIn() {
      this.$router.push({ name: 'login' });
    },

    // ---------- login logic (verbatim from login.component.vue) ----------
    async handleLogin({ email, password }) {
      this.isLoggingIn = true;
      try {
        const userPayload = { username: email, password: password };
        this.signInRequest = new SignInRequest(userPayload);

        await this.signIn(this.signInRequest);

        const role = this.userRole;
        if (role === 'RoleAdmin') {
          this.$router.push({ name: 'home-admin' });
        } else {
          this.$toast.add({
            severity: 'warn',
            summary: 'Acceso restringido',
            detail: 'Esta plataforma es solo para administradores. Inicia sesión desde EduSpace Mobile.',
            life: 5000,
          });
        }
      } catch (error) {
        const code = error?.response?.data?.code;
        if (error?.response?.status === 403 && code === 'AccountNotActivated') {
          this.$toast.add({
            severity: 'warn',
            summary: 'Cuenta no activada',
            detail: 'Tu cuenta no está activada. Revisa tu correo para activarla.',
            life: 5000,
          });
        } else {
          this.$toast.add({
            severity: 'error',
            summary: 'Error de acceso',
            detail: 'Credenciales incorrectas. Verifica tu usuario y contraseña.',
            life: 3000,
          });
        }
      } finally {
        this.isLoggingIn = false;
      }
    },

    // ---------- register logic (verbatim from register.component.vue) ----------
    async handleSubmit(formData) {
      try {
        this.registrationError = null;

        formData.administratorId = this.userId;

        const signUpRequest = new SignUpRequest(formData);
        await RegisterService.registerAdministrator(signUpRequest);
      } catch (error) {
        console.error("Error during registration:", error.message || error);
        this.registrationError = error.message || "Error desconocido durante el registro";
        throw error;
      }
    },
  },
};
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card" :class="{ 'panels-right-active': mode === 'signup' }">

      <!-- ── Login panel (left slot) ── -->
      <div class="panel panel--login">
        <LoginForm :loading="isLoggingIn" @onLogin="handleLogin" />
      </div>

      <!-- ── Register panel (right slot) ── -->
      <div class="panel panel--register">
        <div v-if="registrationError" class="error-banner">
          <p>{{ registrationError }}</p>
        </div>
        <RegisterForm :onSubmit="handleSubmit" />
      </div>

      <!-- ── Sliding overlay ── -->
      <div class="overlay-wrapper">
        <div class="overlay">

          <!-- Shown when overlay is on the left (signup mode) -->
          <div class="overlay-panel overlay-panel--left">
            <h2>Welcome Back!</h2>
            <p>To keep connected with us please login with your personal info</p>
            <pv-button label="SIGN IN" class="overlay-button" @click="goToSignIn" />
          </div>

          <!-- Shown when overlay is on the right (signin mode) -->
          <div class="overlay-panel overlay-panel--right">
            <h2>Good day!</h2>
            <p>Enter your personal details and start your journey with us</p>
            <pv-button label="SIGN UP" class="overlay-button" @click="goToSignUp" />
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ────────────────────────────────────────────────
   Escape the 20px shell padding — same trick as
   activate.component.vue so no white gap appears.
──────────────────────────────────────────────── */
/* Outer shell — bleeds past .main-content padding so the page
   background fills the viewport edge-to-edge (same trick as
   activate.component.vue). Centers the auth card inside. */
.auth-shell {
  display: flex;
  align-items: center;
  justify-content: center;

  align-self: stretch;
  min-height: calc(100vh - 40px);
  margin: -20px;
  padding: 20px;

  background: #f7fafc;
}

/* The actual auth card — original sizing: 60% wide × 50vh,
   centered. Holds the two form panels + the sliding overlay. */
.auth-card {
  position: relative;
  overflow: hidden;
  width: 60%;
  min-height: 50vh;
  display: flex;
  align-items: stretch;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #fff;
}

/* ────────────────────────────────────────────────
   Form panels — each takes half the card.
   They are stacked in a row; the overlay sits on
   top and slides between them.
──────────────────────────────────────────────── */
.panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: #fff;
  /* ensure forms sit below the overlay */
  z-index: 1;
}

/* ────────────────────────────────────────────────
   Overlay wrapper — always 50% wide, slides
   between right (default) and left (signup).
──────────────────────────────────────────────── */
.overlay-wrapper {
  position: absolute;
  top: 0;
  left: 50%;            /* default: overlay on the right half */
  width: 50%;
  height: 100%;
  overflow: hidden;
  z-index: 10;
  transition: transform 0.6s ease-in-out;
  border-radius: 0 15px 15px 0;
}

/* Slide overlay to the left half when signup is active */
.auth-card.panels-right-active .overlay-wrapper {
  transform: translateX(-100%);
  border-radius: 15px 0 0 15px;
}

/* The gradient panel inside the wrapper */
.overlay {
  position: relative;
  width: 200%;           /* double-wide so both sub-panels fit side-by-side */
  height: 100%;
  left: -100%;           /* default: show right sub-panel (translateX(0)) */
  background: linear-gradient(to bottom, #34a7c1, #fad961);
  color: #fff;
  transition: transform 0.6s ease-in-out;
  display: flex;
  align-items: stretch;
}

/* When signup is active, shift the inner panel to show the left sub-panel */
.auth-card.panels-right-active .overlay {
  transform: translateX(50%);
}

/* Each sub-panel inside the overlay occupies half of the double-wide overlay */
.overlay-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
  gap: 16px;
}

.overlay-panel h2 {
  font-size: 2em;
  margin: 0;
  color: #fff;
}

.overlay-panel p {
  margin: 0 0 8px;
  line-height: 1.5;
}

.overlay-button {
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  width: 150px;
  margin-top: 8px;
}

.overlay-button:hover,
.overlay-button:focus,
.overlay-button:active {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
  border: none;
  outline: none;
  box-shadow: none;
}

/* ────────────────────────────────────────────────
   Error banner inside register panel
──────────────────────────────────────────────── */
.error-banner {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 16px;
  width: 100%;
  max-width: 480px;
}

.error-banner p {
  margin: 0;
}

/* ────────────────────────────────────────────────
   Mobile: stack vertically, hide overlay, show
   only the active form panel.
──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .auth-card {
    flex-direction: column;
    width: 90%;
    height: auto;
    min-height: 70vh;
  }

  .panel {
    width: 100%;
  }

  /* Hide the inactive panel on mobile */
  .auth-card:not(.panels-right-active) .panel--register {
    display: none;
  }

  .auth-card.panels-right-active .panel--login {
    display: none;
  }

  /* Kill the sliding overlay on mobile — not needed */
  .overlay-wrapper {
    display: none;
  }
}
</style>
