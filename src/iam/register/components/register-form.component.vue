<script>
export default {
  name: "register-form",
  props: ["onSubmit"],
  data() {
    return {
      formData: {
        firstName: "",
        lastName: "",
        birthdate: null,
        phone: "",
        email: "",
        password: "",
        dni: "",
        address: "",
        username: "",
      },
      dialogVisible: false, // Controla la visibilidad del diálogo
      errors: {
        email: "",
        dni: "",
        phone: "",
        birthdate: "",
      },
    };
  },
  methods: {
    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    validateDNI(dni) {
      // DNI peruano: exactamente 8 dígitos
      const dniRegex = /^\d{8}$/;
      return dniRegex.test(dni);
    },
    validatePhone(phone) {
      // Teléfono peruano: exactamente 9 dígitos, empezando con 9
      const phoneRegex = /^9\d{8}$/;
      return phoneRegex.test(phone);
    },
    validateAge(birthdate) {
      if (!birthdate) return false;

      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      // Ajustar la edad si aún no ha cumplido años este año
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }

      return age >= 18;
    },
    validateField(field, value) {
      this.errors[field] = "";

      switch (field) {
        case "email":
          if (value && !this.validateEmail(value)) {
            this.errors.email =
              "Ingrese un email válido (ejemplo: usuario@dominio.com)";
          }
          break;
        case "dni":
          if (value && !this.validateDNI(value)) {
            this.errors.dni = "El DNI debe tener exactamente 8 dígitos";
          }
          break;
        case "phone":
          if (value && !this.validatePhone(value)) {
            this.errors.phone =
              "El teléfono debe tener 9 dígitos y comenzar con 9 (ej: 987654321)";
          }
          break;
        case "birthdate":
          if (value && !this.validateAge(value)) {
            this.errors.birthdate = "Debe ser mayor de 18 años";
          }
          break;
      }
    },
    isFormValid() {
      // Validar todos los campos requeridos (incluyendo birthdate)
      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "username",
        "password",
        "dni",
        "phone",
        "birthdate",
      ];
      const hasAllRequiredFields = requiredFields.every(
        (field) => this.formData[field]
      );

      // Validar formatos específicos
      const isEmailValid = this.validateEmail(this.formData.email);
      const isDNIValid = this.validateDNI(this.formData.dni);
      const isPhoneValid = this.validatePhone(this.formData.phone);
      const isAgeValid = this.validateAge(this.formData.birthdate);

      return (
        hasAllRequiredFields &&
        isEmailValid &&
        isDNIValid &&
        isPhoneValid &&
        isAgeValid
      );
    },
    async submitForm() {
      // Validar todos los campos antes de enviar
      this.validateField("email", this.formData.email);
      this.validateField("dni", this.formData.dni);
      this.validateField("phone", this.formData.phone);
      this.validateField("birthdate", this.formData.birthdate);

      if (this.isFormValid()) {
        try {
          await this.onSubmit(this.formData);
          this.dialogVisible = true; // Muestra el diálogo cuando se crea la cuenta exitosamente
        } catch (error) {
          // No mostrar el diálogo si hay error
          console.error("Error en el registro:", error);
        }
      }
    },
    goToLogin() {
      this.$router.push("/login");
    },
  },
};
</script>

<template>
  <div class="register-container">
    <!-- Diálogo de éxito -->
    <pv-dialog
      v-model:visible="dialogVisible"
      header="Account Created Successfully"
    >
      <p>Your account has been created successfully!</p>
      <pv-button label="Continue" class="dialog-button" @click="goToLogin" />
    </pv-dialog>

    <!-- Left Side -->
    <div class="left-side">
      <h2>Welcome Back!</h2>
      <p>To keep connected with us please login with your personal info</p>
      <pv-button label="SIGN IN" class="sign-in-button" @click="goToLogin" />
    </div>

    <!-- Right Side (Form) -->
    <div class="right-side">
      <h2>Create Account</h2>

      <!-- Registration Form -->
      <form @submit.prevent="submitForm" class="register-form">
        <div class="form-field">
          <pv-input-text
            v-model="formData.firstName"
            placeholder="Name"
            required
          />
          <pv-input-text
            v-model="formData.lastName"
            placeholder="Last Name"
            required
          />
        </div>

        <div class="form-field">
          <div class="input-container">
            <pv-calendar
              v-model="formData.birthdate"
              placeholder="Fecha de nacimiento"
              required
              :class="{ 'p-invalid': errors.birthdate }"
              @blur="validateField('birthdate', formData.birthdate)"
              :maxDate="new Date()"
              dateFormat="dd/mm/yy"
              :showIcon="true"
            />
            <small v-if="errors.birthdate" class="error-message">{{
              errors.birthdate
            }}</small>
          </div>
          <div class="input-container">
            <pv-input-text
              v-model="formData.phone"
              placeholder="Teléfono (ej: 987654321)"
              required
              :class="{ 'p-invalid': errors.phone }"
              @input="formData.phone = formData.phone.replace(/\D/g, '')"
              @blur="validateField('phone', formData.phone)"
              maxlength="9"
            />
            <small v-if="errors.phone" class="error-message">{{
              errors.phone
            }}</small>
          </div>
        </div>

        <div class="form-field">
          <div class="input-container">
            <pv-input-text
              v-model="formData.email"
              placeholder="Email"
              required
              :class="{ 'p-invalid': errors.email }"
              @blur="validateField('email', formData.email)"
            />
            <small v-if="errors.email" class="error-message">{{
              errors.email
            }}</small>
          </div>
        </div>

        <div class="form-field">
          <pv-input-text
            v-model="formData.username"
            placeholder="Username"
            toggleMask
            required
          />
          <pv-password
            v-model="formData.password"
            placeholder="Password"
            toggleMask
            required
          />
        </div>

        <div class="form-field">
          <div class="input-container">
            <pv-input-text
              v-model="formData.dni"
              placeholder="DNI (8 dígitos)"
              required
              :class="{ 'p-invalid': errors.dni }"
              @input="formData.dni = formData.dni.replace(/\D/g, '')"
              @blur="validateField('dni', formData.dni)"
              maxlength="8"
            />
            <small v-if="errors.dni" class="error-message">{{
              errors.dni
            }}</small>
          </div>
          <pv-input-text
            v-model="formData.address"
            placeholder="Dirección"
            required
          />
        </div>

        <pv-button type="submit" label="SIGN UP" class="sign-up-button" />
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Estilos del componente de registro */
.register-container {
  display: flex;
  width: 100%;
  height: 100vh;
  align-items: center;
  justify-content: center;
}

.left-side,
.right-side {
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.left-side {
  background: linear-gradient(to bottom, #34a7c1, #fad961);
  color: white;
  height: 50%;
  width: 50%;
  border-radius: 15px 0 0 15px;
  text-align: center;
}

.right-side {
  width: 50%;
  height: 50%;
  background-color: white;
  border-radius: 0 15px 15px 0;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

p {
  margin-bottom: 1.5em;
}

.form-field {
  display: flex;
  gap: 10px;
  margin-bottom: 1em;
}

.input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.error-message {
  color: #dc3545;
  font-size: 0.8em;
  margin-top: 0.25em;
  min-height: 1.2em;
}

.sign-up-button,
.submit-button {
  margin-top: 20px;
  background-color: #00bcd4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.sign-up-button:hover,
.submit-button:hover {
  background-color: #0097a7;
}

.dialog-button {
  margin-top: 20px;
  background-color: #00bcd4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.dialog-button:hover {
  background-color: #0097a7;
}
</style>
