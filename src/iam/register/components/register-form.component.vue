<script>
export default {
  name: "register-form",
  props: ["onSubmit"],
  data() {
    return {
      formData: {
        firstName: "",
        lastName: "",
        birthdate: this.getDefaultAdultBirthdate(),
        phone: "",
        email: "",
        password: "",
        dni: "",
        address: "",
        username: "",
      },
      errors: {
        email: "",
        dni: "",
        phone: "",
        birthdate: "",
      },
    };
  },
  methods: {
    getDefaultAdultBirthdate() {
      const today = new Date();
      return new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
    },
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
            this.errors.email = this.$t('iam.register.errors.email');
          }
          break;
        case "dni":
          if (value && !this.validateDNI(value)) {
            this.errors.dni = this.$t('iam.register.errors.dni');
          }
          break;
        case "phone":
          if (value && !this.validatePhone(value)) {
            this.errors.phone = this.$t('iam.register.errors.phone');
          }
          break;
        case "birthdate":
          if (value && !this.validateAge(value)) {
            this.errors.birthdate = this.$t('iam.register.errors.birthdate');
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
          const email = this.formData.email;
          this.$toast.add({
            severity: 'info',
            summary: this.$t('iam.register.toast.checkEmailSummary'),
            detail: this.$t('iam.register.toast.checkEmailDetail', { email }),
            life: 8000
          });
          this.$router.push({ name: 'login' });
        } catch (error) {
          // No mostrar el diálogo si hay error
          console.error("Error en el registro:", error);
        }
      }
    },
  },
};
</script>

<template>
  <div class="register-panel">
    <h2>{{ $t('iam.register.title') }}</h2>

    <!-- Registration Form -->
    <form @submit.prevent="submitForm" class="register-form">
        <div class="form-field">
          <pv-input-text
            v-model="formData.firstName"
            :placeholder="$t('iam.register.placeholders.firstName')"
            required
          />
          <pv-input-text
            v-model="formData.lastName"
            :placeholder="$t('iam.register.placeholders.lastName')"
            required
          />
        </div>

        <div class="form-field">
          <div class="input-container">
            <pv-date-picker
              v-model="formData.birthdate"
              :placeholder="$t('iam.register.placeholders.birthdate')"
              required
              :class="{ 'p-invalid': errors.birthdate }"
              @blur="validateField('birthdate', formData.birthdate)"
              :maxDate="new Date()"
              dateFormat="dd/mm/yy"
              showIcon
              iconDisplay="input"
            />
            <small v-if="errors.birthdate" class="error-message">{{
              errors.birthdate
            }}</small>
          </div>
          <div class="input-container">
            <pv-input-text
              v-model="formData.phone"
              :placeholder="$t('iam.register.placeholders.phone')"
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
              :placeholder="$t('iam.register.placeholders.email')"
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
            :placeholder="$t('iam.register.placeholders.username')"
            toggleMask
            required
          />
          <pv-password
            v-model="formData.password"
            :placeholder="$t('iam.register.placeholders.password')"
            toggleMask
            required
          />
        </div>

        <div class="form-field">
          <div class="input-container">
            <pv-input-text
              v-model="formData.dni"
              :placeholder="$t('iam.register.placeholders.dni')"
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
            :placeholder="$t('iam.register.placeholders.address')"
            required
          />
        </div>

        <pv-button type="submit" :label="$t('iam.register.signUpButton')" class="sign-up-button" />
      </form>
  </div>
</template>

<style scoped>
/* Form-only styles — the split-screen layout is owned by auth-split-screen */
.register-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 480px;
}

.register-panel h2 {
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  margin-bottom: 0.75em;
  color: #2d3748;
}

.register-form {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* `flex-wrap` lets the two-column rows collapse to single-column when
   the panel is narrow. `min-width` on children sets the breakpoint at
   which they wrap, instead of relying on a single media query. */
.form-field {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(8px, 1.5vw, 12px);
  margin-bottom: 1em;
}

.form-field > * {
  flex: 1 1 calc(50% - 12px);
  min-width: 180px;
}

.input-container {
  display: flex;
  flex-direction: column;
}

/* Force every PrimeVue input to fill its flex slot — by default
   pv-input-text / pv-password / pv-date-picker render at intrinsic width. */
.form-field :deep(.p-inputtext),
.form-field :deep(.p-password),
.form-field :deep(.p-password-input),
.form-field :deep(.p-datepicker),
.form-field :deep(.p-datepicker-input) {
  width: 100%;
}

.error-message {
  color: #dc3545;
  font-size: 0.8em;
  margin-top: 0.25em;
  min-height: 1.2em;
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
  width: min(180px, 100%);
  align-self: center;
}

.sign-up-button:hover,
.sign-up-button:focus,
.sign-up-button:active {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
  border: none;
  outline: none;
  box-shadow: none;
}

@media (max-width: 480px) {
  .form-field > * {
    flex-basis: 100%;
  }

  .sign-up-button {
    width: 100%;
  }
}
</style>
