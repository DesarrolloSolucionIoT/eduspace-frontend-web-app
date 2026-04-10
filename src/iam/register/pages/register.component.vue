<script>
import RegisterForm from "../components/register-form.component.vue";
import {SignUpRequest} from "../../model/sign-up.request.js";
import RegisterService from "../services/register.services.js";
import {mapGetters} from "vuex";

export default {
  name: "RegisterPage",
  components: { RegisterForm },
  computed: {
    ...mapGetters("user", ["userId"]),
  },
  data() {
    return {
      registrationError: null,
    };
  },
  methods: {
    async handleSubmit(formData) {
      try {
        this.registrationError = null;

        // Agregar administratorId al formData
        formData.administratorId = this.userId;

        // Crear la instancia de SignUpRequest con los datos del formulario
        const signUpRequest = new SignUpRequest(formData);

        // Llamar al servicio de registro con la solicitud
        await RegisterService.registerAdministrator(
          signUpRequest
        );
      } catch (error) {
        console.error("Error during registration:", error.message || error);
        this.registrationError =
          error.message || "Error desconocido durante el registro";

        // Pasar el error de vuelta al formulario para que no muestre el diálogo de éxito
        throw error;
      }
    },
  },
};
</script>

<template>
  <div>
    <!-- Mostrar error general si existe -->
    <div v-if="registrationError" class="error-banner">
      <p>{{ registrationError }}</p>
    </div>

    <!-- Pasar el manejador de envío al formulario -->
    <RegisterForm @submit="handleSubmit" />
  </div>
</template>

<style scoped>
.error-banner {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.error-banner p {
  margin: 0;
}
</style>
