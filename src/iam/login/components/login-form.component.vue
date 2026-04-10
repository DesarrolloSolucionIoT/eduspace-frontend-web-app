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
    <h2 class="login-title">Sign in</h2>
    <form @submit.prevent="submitLogin" class="login-form-grid">
      <div class="login-inputs">
        <pv-input-text v-model="email" placeholder="Email" required class="login-input" />
        <pv-password v-model="password" placeholder="Password" toggleMask required class="login-input" />
      </div>
      <div class="login-actions">
        <pv-button :loading="loading" class="sign-in-button" label="SIGN IN" type="submit"/>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  margin: auto;
}

.login-title {
  text-align: center;
  width: 100%;
  margin-bottom: 18px;
}

.login-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 0px 0px;
  width: 100%;
}

.login-inputs {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.login-actions {
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

.sign-in-button {
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  width: 150px;
}

.sign-in-button:hover {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
}

.login-input {
  margin-bottom: 18px;
}

@media (max-width: 600px) {
  .login-form-grid {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .login-inputs, .login-actions {
    grid-column: unset;
    grid-row: unset;
    width: 100%;
    justify-content: center;
    align-items: center;
  }
}
</style>
