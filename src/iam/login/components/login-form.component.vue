<script>
export default {
  name: "login-form",
  props: {
    loading: {type: Boolean, default: false}
  },
  data() {
    return {
      email: "",
      password: "",
      role: "",
      roles: [
        { label: "Administrator", value: "Administrator" },
        { label: "Teacher", value: "Teacher" }
      ]
    };
  },
  methods: {
    submitLogin() {
      this.$emit("onLogin", { email: this.email, password: this.password});
    }
  }
};
</script>

<template>
  <div class="login-form-container">
    <h2 class="login-title">{{ $t('iam.login.title') }}</h2>
    <form @submit.prevent="submitLogin" class="login-form">
      <pv-input-text v-model="email" :placeholder="$t('iam.login.emailPlaceholder')" required class="login-input" autocomplete="username" />
      <pv-password v-model="password" :placeholder="$t('iam.login.passwordPlaceholder')" toggleMask required class="login-input" inputClass="w-full" autocomplete="current-password" />
      <div class="login-actions">
        <pv-button :loading="loading" class="sign-in-button" :label="$t('iam.login.signInButton')" type="submit"/>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 360px;
  margin: auto;
}

.login-title {
  text-align: center;
  width: 100%;
  margin-bottom: 18px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.login-input {
  width: 100%;
}

/* PrimeVue wraps pv-password in a div — force its child input to fill */
.login-input :deep(.p-inputtext),
.login-input :deep(.p-password),
.login-input :deep(.p-password-input) {
  width: 100%;
}

.login-actions {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}

.sign-in-button {
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  width: min(180px, 100%);
}

.sign-in-button:hover,
.sign-in-button:focus,
.sign-in-button:active {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
  border: none;
  outline: none;
  box-shadow: none;
}

@media (max-width: 480px) {
  .sign-in-button {
    width: 100%;
  }
}
</style>
