<script>
import LoginForm from '../../login/components/login-form.component.vue';
import RegisterForm from '../../register/components/register-form.component.vue';
import LanguageSwitcher from '../../../shared/components/language-switcher.component.vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import { SignInRequest } from '../../model/sign-in.request.js';
import { SignUpRequest } from '../../model/sign-up.request.js';
import RegisterService from '../../register/services/register.services.js';

export default {
  name: "AuthSplitScreen",
  components: { LoginForm, RegisterForm, LanguageSwitcher },

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
    ...mapActions("user", ["signIn", "signOut"]),

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
          // Web is admin-only: this role can't use this app, so undo the
          // sign-in state signIn() just committed instead of leaving the
          // user half-authenticated (sidebar showing over the login form).
          await this.signOut();
          this.$toast.add({
            severity: 'warn',
            summary: this.$t('iam.auth.toast.restrictedAccessSummary'),
            detail: this.$t('iam.auth.toast.restrictedAccessDetail'),
            life: 5000,
          });
        }
      } catch (error) {
        const code = error?.response?.data?.code;
        if (error?.response?.status === 403 && code === 'AccountNotActivated') {
          this.$toast.add({
            severity: 'warn',
            summary: this.$t('iam.auth.toast.notActivatedSummary'),
            detail: this.$t('iam.auth.toast.notActivatedDetail'),
            life: 5000,
          });
        } else {
          this.$toast.add({
            severity: 'error',
            summary: this.$t('iam.auth.toast.loginErrorSummary'),
            detail: this.$t('iam.auth.toast.loginErrorDetail'),
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
        this.registrationError = error.message || this.$t('iam.register.unknownError');
        throw error;
      }
    },
  },
};
</script>

<template>
  <div class="auth-shell">
    <div class="auth-language-switcher">
      <LanguageSwitcher />
    </div>
    <div class="auth-card" :class="{ 'panels-right-active': mode === 'signup' }">

      <!-- ── Login panel (left slot) ── -->
      <div class="panel panel--login">
        <LoginForm :loading="isLoggingIn" @onLogin="handleLogin" />
        <p class="mobile-switcher">
          {{ $t('iam.auth.noAccount') }}
          <button type="button" class="switcher-link" @click="goToSignUp">{{ $t('iam.auth.signUpLink') }}</button>
        </p>
      </div>

      <!-- ── Register panel (right slot) ── -->
      <div class="panel panel--register">
        <div v-if="registrationError" class="error-banner" role="alert">
          <p>{{ registrationError }}</p>
        </div>
        <RegisterForm :onSubmit="handleSubmit" />
        <p class="mobile-switcher">
          {{ $t('iam.auth.hasAccount') }}
          <button type="button" class="switcher-link" @click="goToSignIn">{{ $t('iam.auth.signInLink') }}</button>
        </p>
      </div>

      <!-- ── Sliding overlay ── -->
      <div class="overlay-wrapper">
        <div class="overlay">

          <!-- Shown when overlay is on the left (signup mode) -->
          <div class="overlay-panel overlay-panel--left">
            <h2>{{ $t('iam.auth.overlay.welcomeBackTitle') }}</h2>
            <p>{{ $t('iam.auth.overlay.welcomeBackText') }}</p>
            <pv-button :label="$t('iam.auth.overlay.signInButton')" class="overlay-button" @click="goToSignIn" />
          </div>

          <!-- Shown when overlay is on the right (signin mode) -->
          <div class="overlay-panel overlay-panel--right">
            <h2>{{ $t('iam.auth.overlay.goodDayTitle') }}</h2>
            <p>{{ $t('iam.auth.overlay.goodDayText') }}</p>
            <pv-button :label="$t('iam.auth.overlay.signUpButton')" class="overlay-button" @click="goToSignUp" />
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Outer shell — bleeds past .main-content padding so the page
   background fills the viewport edge-to-edge (same trick as
   activate.component.vue). Centers the auth card inside.
   `100dvh` accounts for the mobile address-bar shrink/grow. */
.auth-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  align-self: stretch;
  min-height: calc(100vh - 40px);
  min-height: calc(100dvh - 40px);
  margin: -20px;
  padding: 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));

  background: #f7fafc;
}

.auth-language-switcher {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
}

/* The auth card scales from compact tablet to large desktop without
   getting cramped or sparse. `min-height: auto` lets the register form
   set the height naturally — no clipped fields on short viewports. */
.auth-card {
  position: relative;
  overflow: hidden;
  width: min(95%, 960px);
  min-height: auto;
  display: flex;
  align-items: stretch;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #fff;
}

/* Form panels — each takes half the card on desktop. Padding scales
   with viewport so the panel never devours the form on small screens. */
.panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: clamp(24px, 4vw, 40px);
  background: #fff;
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
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  margin: 0;
  color: #fff;
}

.overlay-panel p {
  margin: 0 0 8px;
  line-height: 1.5;
  font-size: clamp(0.85rem, 1.2vw, 1rem);
}

.overlay-button {
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  width: min(180px, 80%);
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

/* Mobile-only switcher between login and register (replaces the
   sliding overlay which has no room on small viewports). */
.mobile-switcher {
  display: none;
  margin: 20px 0 0;
  font-size: 0.9rem;
  color: #4a5568;
  text-align: center;
}

.switcher-link {
  background: none;
  border: none;
  padding: 0;
  margin-left: 4px;
  color: #34a7c1;
  font-weight: 600;
  font-size: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.switcher-link:hover,
.switcher-link:focus {
  color: #2fa1b4;
  outline: none;
}

/* Tablet sweet-spot: avoid the abrupt jump between 60% desktop card
   and stacked mobile. The overlay still slides — we just tighten the
   layout so 9 register fields don't squish at 1024px and below. */
@media (max-width: 1024px) {
  .auth-card {
    width: min(92%, 820px);
  }

  .overlay-panel {
    padding: clamp(20px, 3vw, 32px);
  }
}

/* Mobile: stack vertically, hide overlay, show only the active panel.
   Card stretches edge-to-edge (with a small radius) so the form has
   maximum width — critical for the 9-field register form. */
@media (max-width: 768px) {
  .auth-shell {
    padding: 12px;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    margin: -20px;
    min-height: calc(100vh - 24px);
    min-height: calc(100dvh - 24px);
  }

  .auth-card {
    flex-direction: column;
    width: 100%;
    height: auto;
    min-height: auto;
    border-radius: 12px;
  }

  .panel {
    width: 100%;
    padding: clamp(20px, 6vw, 32px) clamp(16px, 5vw, 24px);
  }

  /* Show only the active panel on mobile (no overlay to gate the other) */
  .auth-card:not(.panels-right-active) .panel--register {
    display: none;
  }

  .auth-card.panels-right-active .panel--login {
    display: none;
  }

  /* Kill the sliding overlay on mobile — it has no room to slide */
  .overlay-wrapper {
    display: none;
  }

  /* Surface the switcher only here — desktop uses the overlay buttons */
  .mobile-switcher {
    display: block;
  }
}

/* Small phones: extra-compact padding so 9 register fields still fit
   without horizontal scroll on a 320px viewport. */
@media (max-width: 380px) {
  .panel {
    padding: 18px 12px;
  }
}
</style>
