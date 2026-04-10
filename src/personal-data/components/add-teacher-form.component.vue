<template>
  <form @submit.prevent="submitForm" class="teacher-form">
    <div class="form-section">
      <h3 class="section-title">Personal Information</h3>

      <div class="form-row">
        <div class="form-group">
          <label for="firstName">First Name *</label>
          <pv-input-text
            id="firstName"
            v-model="formData.firstName"
            placeholder="Enter first name"
            required
          />
        </div>
        <div class="form-group">
          <label for="lastName">Last Name *</label>
          <pv-input-text
            id="lastName"
            v-model="formData.lastName"
            placeholder="Enter last name"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="email">Email *</label>
          <pv-input-text
            id="email"
            v-model="formData.email"
            placeholder="example@domain.com"
            required
            :class="{ 'p-invalid': errors.email }"
            @blur="validateField('email', formData.email)"
            @input="validateField('email', formData.email)"
          />
          <small class="error-message">
            {{ errors.email || '&nbsp;' }}
          </small>
        </div>
        <div class="form-group">
          <label for="phone">Phone *</label>
          <pv-input-text
            id="phone"
            v-model="formData.phone"
            placeholder="987654321"
            required
            :class="{ 'p-invalid': errors.phone }"
            @input="formData.phone = formData.phone.replace(/\D/g, ''); validateField('phone', formData.phone)"
            @blur="validateField('phone', formData.phone)"
            maxlength="9"
          />
          <small class="error-message">
            {{ errors.phone || '&nbsp;' }}
          </small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="dni">DNI *</label>
          <pv-input-text
            id="dni"
            v-model="formData.dni"
            placeholder="12345678"
            required
            :class="{ 'p-invalid': errors.dni }"
            @input="formData.dni = formData.dni.replace(/\D/g, ''); validateField('dni', formData.dni)"
            @blur="validateField('dni', formData.dni)"
            maxlength="8"
          />
          <small class="error-message">
            {{ errors.dni || '&nbsp;' }}
          </small>
        </div>
        <div class="form-group">
          <label for="address">Address *</label>
          <pv-input-text
            id="address"
            v-model="formData.address"
            placeholder="Enter address"
            required
          />
        </div>
      </div>
    </div>

    <div class="form-section" v-if="!isEdit">
      <h3 class="section-title">Account Credentials</h3>

      <div class="form-row">
        <div class="form-group">
          <label for="username">Username *</label>
          <pv-input-text
            id="username"
            v-model="formData.username"
            placeholder="Enter username"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Password *</label>
          <pv-password
            id="password"
            v-model="formData.password"
            placeholder="Enter password"
            required
            :feedback="false"
          />
        </div>
      </div>
    </div>

    <div class="form-actions">
      <pv-button
        label="Cancel"
        severity="secondary"
        @click="cancel"
        type="button"
      />
      <pv-button
        :label="isEdit ? 'Update Teacher' : 'Save Teacher'"
        icon="pi pi-check"
        type="submit"
        :loading="loading"
      />
    </div>
  </form>
</template>

<script>
import {mapGetters} from "vuex";

export default {
  name: "add-teacher-form",
  props: {
    teacher: {
      type: Object,
      default: null,
    },
    isEdit: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      formData: {
        firstName: "",
        lastName: "",
        email: "",
        dni: "",
        address: "",
        phone: "",
        administratorId: null,
        username: "",
        password: "",
      },
      errors: {
        email: "",
        dni: "",
        phone: "",
      },
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),
  },
  watch: {
    userId: {
      immediate: true,
      handler(newValue) {
        this.formData.administratorId = newValue;
      },
    },
    teacher: {
      immediate: true,
      handler(newTeacher) {
        if (newTeacher && this.isEdit) {
          this.formData = {
            firstName: newTeacher.firstName || "",
            lastName: newTeacher.lastName || "",
            email: newTeacher.email || "",
            dni: newTeacher.dni || "",
            address: newTeacher.address || "",
            phone: newTeacher.phone || "",
            administratorId: this.formData.administratorId,
            username: "",
            password: "",
          };
        } else if (!this.isEdit) {
          this.resetForm();
        }
      },
    },
  },
  methods: {
    validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    validateDNI(dni) {
      const dniRegex = /^\d{8}$/;
      return dniRegex.test(dni);
    },
    validatePhone(phone) {
      const phoneRegex = /^9\d{8}$/;
      return phoneRegex.test(phone);
    },
    validateField(field, value) {
      this.errors[field] = "";
      switch (field) {
        case "email":
          if (value && !this.validateEmail(value)) {
            this.errors.email = "Enter a valid email (e.g.: user@domain.com)";
          }
          break;
        case "dni":
          if (value && !this.validateDNI(value)) {
            this.errors.dni = "DNI must be exactly 8 digits";
          }
          break;
        case "phone":
          if (value && !this.validatePhone(value)) {
            this.errors.phone = "Phone must be 9 digits and start with 9";
          }
          break;
      }
    },
    isFormValid() {
      const requiredFields = this.isEdit
        ? ["firstName", "lastName", "email", "dni", "phone", "address"]
        : [
            "firstName",
            "lastName",
            "email",
            "username",
            "password",
            "dni",
            "phone",
            "address",
          ];
      const hasAllRequiredFields = requiredFields.every(
        (field) => this.formData[field]
      );
      const isEmailValid = this.validateEmail(this.formData.email);
      const isDNIValid = this.validateDNI(this.formData.dni);
      const isPhoneValid = this.validatePhone(this.formData.phone);
      return hasAllRequiredFields && isEmailValid && isDNIValid && isPhoneValid;
    },
    submitForm() {
      this.validateField("email", this.formData.email);
      this.validateField("dni", this.formData.dni);
      this.validateField("phone", this.formData.phone);
      if (this.isFormValid()) {
        this.$emit("save", this.formData);
      }
    },
    cancel() {
      this.$emit("cancel");
    },
    resetForm() {
      this.formData = {
        firstName: "",
        lastName: "",
        email: "",
        dni: "",
        address: "",
        phone: "",
        administratorId: this.formData.administratorId,
        username: "",
        password: "",
      };
      this.errors = {
        email: "",
        dni: "",
        phone: "",
      };
    },
  },
};
</script>

<style scoped>
.teacher-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.form-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #495057;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
  min-height: 1.3em;
  opacity: 1;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

/* Responsive */
@media (max-width: 768px) {
  .teacher-form {
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
