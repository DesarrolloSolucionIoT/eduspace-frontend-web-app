<template>
  <div class="verify-container">
    <div class="verify-card">
      <div class="icon-container">
        <i class="pi pi-envelope" style="font-size: 3rem; color: #34a7c1;"></i>
      </div>

      <h2 class="verify-title">Verify Your Email</h2>

      <p class="verify-description">
        We've sent a 6-digit verification code to
      </p>
      <p class="email-display">{{ userEmail }}</p>

      <div class="code-inputs">
        <pv-input-text
            v-for="i in 6"
            :key="i"
            :ref="`codeInput${i}`"
            v-model="code[i-1]"
            :class="{ 'code-input-error': hasError, 'code-input-success': isSuccess }"
            class="code-input"
            inputmode="numeric"
            maxlength="1"
            type="text"
            @input="handleInput(i, $event)"
            @keydown="handleKeyDown(i, $event)"
            @paste="handlePaste"
        />
      </div>

      <div v-if="errorMessage" class="error-message">
        <i class="pi pi-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <div v-if="isSuccess" class="success-message">
        <i class="pi pi-check-circle"></i>
        Code verified successfully!
      </div>

      <pv-button
          :disabled="isVerifying || code.join('').length !== 6"
          :label="isVerifying ? 'Verifying...' : 'Verify Code'"
          :loading="isVerifying"
          class="verify-button"
          icon="pi pi-check"
          @click="submitCode"
      />

      <div class="resend-container">
        <template v-if="canResend">
          <p class="resend-text">Didn't receive the code?</p>
          <pv-button
              :loading="isResending"
              class="resend-button"
              label="Resend Code"
              text
              @click="resendCode"
          />
        </template>
        <template v-else>
          <p class="timer-text">
            Resend code in <span class="timer">{{ countdown }}s</span>
          </p>
        </template>
      </div>

      <pv-button
          class="back-button"
          icon="pi pi-arrow-left"
          label="Back to Login"
          text
          @click="goBack"
      />
    </div>
  </div>
</template>

<script>
import {mapActions, mapGetters} from 'vuex';

export default {
  name: "verify-code",
  data() {
    return {
      code: new Array(6).fill(''),
      errorMessage: '',
      isVerifying: false,
      isResending: false,
      isSuccess: false,
      hasError: false,
      countdown: 60,
      canResend: false,
      countdownInterval: null,
    };
  },
  computed: {
    ...mapGetters("user", ["userRole"]),
    userEmail() {
      return this.$route.query.email || 'your email';
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.$refs.codeInput1[0].$el.focus();
    });
    this.startCountdown();
  },
  beforeUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  },
  methods: {
    ...mapActions("user", ["verifyCodeAndLogin", "signIn"]),

    startCountdown() {
      this.canResend = false;
      this.countdown = 60;
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      this.countdownInterval = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.countdownInterval);
          this.canResend = true;
        }
      }, 1000);
    },

    handleInput(index, event) {
      const value = event.target.value;

      this.code[index - 1] = value.replace(/\D/g, '');

      this.errorMessage = '';
      this.hasError = false;

      if (value.length === 1 && index < 6) {
        const nextInputRef = this.$refs[`codeInput${index + 1}`];
        if (nextInputRef && nextInputRef[0]) {
          nextInputRef[0].$el.focus();
        }
      }

      if (this.code.join('').length === 6) {
        this.submitCode();
      }
    },

    handleKeyDown(index, event) {
      if (event.key === 'Backspace') {
        if (!this.code[index - 1] && index > 1) {
          const prevInputRef = this.$refs[`codeInput${index - 1}`];
          if (prevInputRef && prevInputRef[0]) {
            prevInputRef[0].$el.focus();
          }
        }
        this.errorMessage = '';
        this.hasError = false;
      }

      if (event.key === 'ArrowLeft' && index > 1) {
        event.preventDefault();
        const prevInputRef = this.$refs[`codeInput${index - 1}`];
        if (prevInputRef && prevInputRef[0]) {
          prevInputRef[0].$el.focus();
        }
      }

      if (event.key === 'ArrowRight' && index < 6) {
        event.preventDefault();
        const nextInputRef = this.$refs[`codeInput${index + 1}`];
        if (nextInputRef && nextInputRef[0]) {
          nextInputRef[0].$el.focus();
        }
      }
    },

    handlePaste(event) {
      event.preventDefault();
      const pastedData = event.clipboardData.getData('text').replace(/\D/g, '');

      if (pastedData.length === 6) {
        for (let i = 0; i < 6; i++) {
          this.code[i] = pastedData[i];
        }
        const lastInputRef = this.$refs.codeInput6;
        if (lastInputRef && lastInputRef[0]) {
          lastInputRef[0].$el.focus();
        }
        this.submitCode();
      }
    },

    async submitCode() {
      this.isVerifying = true;
      this.errorMessage = '';
      this.hasError = false;
      this.isSuccess = false;
      const fullCode = this.code.join('');

      if (fullCode.length !== 6) {
        this.errorMessage = 'Please enter the complete 6-digit code';
        this.hasError = true;
        this.isVerifying = false;
        return;
      }

      try {
        const username = this.$route.query.email;
        const payload = { username: username, code: fullCode };

        await this.verifyCodeAndLogin(payload);

        this.isSuccess = true;

        setTimeout(() => {
          if (this.userRole === "RoleAdmin") {
            this.$router.push("/dashboard-admin/home-admin");
          } else if (this.userRole === "RoleTeacher") {
            this.$router.push("/dashboard-teacher/home-teacher");
          } else {
            this.$router.push({name: 'home'});
          }
        }, 800);

      } catch (error) {
        console.error("Backend error:", error);
        this.errorMessage = 'Invalid or expired code. Please try again';
        this.hasError = true;
        this.code = new Array(6).fill('');
        this.$nextTick(() => {
          this.$refs.codeInput1[0].$el.focus();
        });
      } finally {
        this.isVerifying = false;
      }
    },

    async resendCode() {
      this.isResending = true;
      this.errorMessage = '';
      this.code = new Array(6).fill('');

      try {
        const username = this.$route.query.email;
        await this.signIn({username, password: ''});

        this.$toast.add({
          severity: 'success',
          summary: 'Code Sent',
          detail: 'A new verification code has been sent to your email',
          life: 3000
        });

        this.startCountdown();
        this.$nextTick(() => {
          this.$refs.codeInput1[0].$el.focus();
        });
      } catch (error) {
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to resend code. Please try again',
          life: 3000
        });
      } finally {
        this.isResending = false;
      }
    },

    goBack() {
      this.$router.push({name: 'login'});
    }
  },
};
</script>

<style scoped>
.verify-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.verify-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 50px 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  animation: slideUp 0.5s ease-out;
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

.icon-container {
  margin-bottom: 20px;
}

.verify-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 10px;
}

.verify-description {
  color: #718096;
  font-size: 1rem;
  margin-bottom: 5px;
}

.email-display {
  color: #34a7c1;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 30px;
  word-break: break-all;
}

.code-inputs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 30px 0;
}

.code-input {
  width: 55px;
  height: 60px;
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
  background: #f7fafc;
}

.code-input:focus {
  border-color: #34a7c1;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 167, 193, 0.1);
  transform: scale(1.05);
}

.code-input-error {
  border-color: #f56565;
  animation: shake 0.5s;
}

.code-input-success {
  border-color: #48bb78;
  background: #f0fff4;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #f56565;
  background: #fff5f5;
  padding: 12px 20px;
  border-radius: 10px;
  margin: 20px 0;
  font-size: 0.95rem;
  animation: slideDown 0.3s ease-out;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #48bb78;
  background: #f0fff4;
  padding: 12px 20px;
  border-radius: 10px;
  margin: 20px 0;
  font-size: 0.95rem;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.verify-button {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  border: none;
  border-radius: 12px;
  margin: 20px 0 10px 0;
  transition: all 0.2s ease;
}

.verify-button:hover:not(:disabled) {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(52, 167, 193, 0.3);
}

.verify-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resend-container {
  margin: 25px 0;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.resend-text {
  color: #718096;
  font-size: 0.95rem;
  margin-bottom: 10px;
}

.timer-text {
  color: #718096;
  font-size: 0.95rem;
}

.timer {
  color: #34a7c1;
  font-weight: 700;
  font-size: 1.1rem;
}

.resend-button {
  color: #34a7c1;
  font-weight: 600;
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.resend-button:hover {
  color: #2fa1b4;
  background: rgba(52, 167, 193, 0.1);
}

.back-button {
  color: #718096;
  font-weight: 500;
  margin-top: 10px;
  transition: all 0.2s ease;
}

.back-button:hover {
  color: #2d3748;
  background: rgba(0, 0, 0, 0.05);
}

@media (max-width: 600px) {
  .verify-card {
    padding: 40px 25px;
  }

  .verify-title {
    font-size: 1.6rem;
  }

  .code-inputs {
    gap: 8px;
  }

  .code-input {
    width: 45px;
    height: 50px;
    font-size: 1.5rem;
  }

  .email-display {
    font-size: 0.95rem;
  }
}

@media (max-width: 400px) {
  .code-input {
    width: 38px;
    height: 45px;
    font-size: 1.3rem;
  }

  .code-inputs {
    gap: 6px;
  }
}
</style>