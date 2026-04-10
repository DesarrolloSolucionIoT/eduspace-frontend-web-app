<script>
import LoginForm from '../components/login-form.component.vue';
import {mapActions, mapState} from 'vuex';
import {SignInRequest} from "../../model/sign-in.request.js";

export default {
  name: "LoginPage",
  components: { LoginForm },
  data() {
    return {
      signInRequest: new SignInRequest({}),
      isLoggingIn: false
    };
  },
  computed: {
    // Correcta ubicación para mapState
    ...mapState("user", {
      userId: "id",
      userRole: "role",
      userToken: "token",
    }),
  },
  methods: {
    ...mapActions("user", ["signIn"]),

    async handleLogin({ email, password }) {
      this.isLoggingIn = true;
      try {
        const userPayload = { username: email, password: password };
        this.signInRequest = new SignInRequest(userPayload);

        await this.signIn(this.signInRequest);

        this.$router.push({name: "verify-code", query: { email: email }});

        // if (this.userRole === "RoleAdmin") {
        //   this.$router.push("/dashboard-admin/home-admin");
        // } else if (this.userRole === "RoleTeacher") {
        //   this.$router.push("/dashboard-teacher/home-teacher");
        // }
      } catch {
        this.$toast.add({
          severity: 'error',
          summary: 'Error de acceso',
          detail: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
          life: 3000
        });
      } finally {
        this.isLoggingIn = false;
      }
    },

    goToRegister() {
      this.$router.push({ name: 'register' }); // Asegúrate de que la ruta "register" está definida en tu configuración de rutas
    },
  },
};
</script>



<template>
  <div class="login-container">
    <!-- Left Side (Login Form) -->
    <div class="left-side">
      <LoginForm :loading="isLoggingIn" @onLogin="handleLogin"/>
    </div>
    <!-- Right Side -->
    <div class="right-side">
      <h2>Good day!</h2>
      <p>Enter your personal details and start your journey with us</p>
      <pv-button label="SIGN UP" class="sign-up-button" @click="goToRegister" />
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  width: 60%;
  height: 100vh;
  align-items: center;
  justify-content: center;
  border: none;
}

.left-side, .right-side {
  width: 50%;
  height: 50%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.left-side {
  background-color: white;
  border-radius: 15px 0 0 15px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
}

.right-side {
  background: linear-gradient(to bottom, #34a7c1, #fad961);
  color: white;
  border-radius: 0 15px 15px 0;
  text-align: center;
}

h2 {
  font-size: 2em;
  margin-bottom: 0.5em;
  color: #000;
}

.right-side h2 {
  color: white;
}

p {
  color: white;
  margin-bottom: 1.5em;
}

.sign-up-button {
  margin-top: 20px;
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  width: 150px;
  text-align: center;
}

.login-container .sign-up-button:hover {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
  color: white;
  border: none;
}
</style>
