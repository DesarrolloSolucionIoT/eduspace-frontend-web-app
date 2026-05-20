<script>
import {TeacherService} from "../../../personal-data/services/teacher.service.js";

export default {
  name: "classroom-create-and-edit",
  props: {
    classroom: {
      type: Object,
      required: true,
      default: () => ({
        name: '',
        description: '',
        teacherId: null
      }),
    },
    isCreateMode: {
      type: Boolean,
      default: true
    },
    serverError: {
      type: String,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: { ...this.classroom },
      teachers: []
    };
  },
  async mounted() {
    try {
      const response = await TeacherService.fetchTeachers();
      this.teachers = JSON.parse(JSON.stringify(response));
      this.$forceUpdate();
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  },
  methods: {
    save() {
      if (!this.form.name || !this.form.description || !this.form.teacherId) {
        this.$toast.add({
          severity: 'warn',
          summary: this.$t('classroomSpace.common.validation.incompleteFieldsTitle'),
          detail: this.$t('classroomSpace.common.validation.fillAllFields'),
          life: 3000
        });
        return;
      }
      this.$emit("save", this.form);
    },
    cancel() {
      this.$emit("cancel");
    },
    clearServerError() {
      // Inform parent to clear the server error when user makes changes
      if (this.serverError) {
        this.$emit('clear-server-error');
      }
    }
  },
  computed: {
    teacherOptions() {
      return this.teachers.map(teacher => ({
        label: `${teacher.firstName} ${teacher.lastName}`,
        value: teacher.id,
      }));
    },
    // If serverError mentions the name/title, show it inline under the Name field
    nameFieldError() {
      if (!this.serverError) return null;
      const s = this.serverError;
      // check English and Spanish keywords that indicate the error refers to the name/title
      const nameKeywords = /title|name|nombre|titulo|aula/i;
      return nameKeywords.test(s) ? s : null;
    }
  }
};
</script>

<template>
  <div class="classroom-create-and-edit-container">
    <div class="breadcrumb" style="display: flex; align-items: center">
      <h4 style="margin-right: 20px">{{ $t('classroomSpace.common.breadcrumbRoot') }}</h4>
      <i class="pi pi-chevron-right"></i>
      <h4 style="margin-left: 20px">{{ $t('classroomSpace.classrooms.title') }}</h4>
      <i class="pi pi-chevron-right"></i>
      <h4 style="margin-left: 20px">{{ isCreateMode ? $t('classroomSpace.classrooms.addTitle') : $t('classroomSpace.classrooms.editSingular') }}</h4>
    </div>

    <div class="classroom-create-form">
    <div class="form-header">
      <h2>{{ isCreateMode ? $t('classroomSpace.classrooms.createSingular') : $t('classroomSpace.classrooms.editSingular') }}</h2>
    </div>
    <!-- If the server error is specifically about the name/title, show it inline under Name. Otherwise show a general box. -->
    <div v-if="!nameFieldError && serverError" class="server-error">
      {{ serverError }}
    </div>
    <form @submit.prevent="save" class="form-grid">
      <div class="form-field">
        <pv-float-label>{{ $t('common.name') }}:</pv-float-label>
        <pv-input-text v-model="form.name" :placeholder="$t('classroomSpace.common.namePlaceholder')" @input="clearServerError" />
        <div v-if="nameFieldError" class="field-error">{{ nameFieldError }}</div>
      </div>

      <div class="form-field">
        <pv-float-label>{{ $t('common.description') }}:</pv-float-label>
        <pv-input-text v-model="form.description" :placeholder="$t('classroomSpace.common.descriptionPlaceholder')" @input="clearServerError" />
      </div>

      <pv-float-label for="teacher">{{ $t('classroomSpace.classrooms.teacher') }}</pv-float-label>
      <pv-select
          v-model="form.teacherId"
          :options="teacherOptions"
          option-label="label"
          option-value="value"
          :placeholder="$t('classroomSpace.classrooms.selectTeacherPlaceholder')"
          class="form-control"
          @change="clearServerError"
      />

      <div class="form-actions">
        <pv-button :loading="loading" class="p-button-success" :label="$t('common.save')" type="submit"/>
        <pv-button
          type="button"
          :label="$t('common.cancel')"
          class="p-button-secondary"
          @click="cancel"
        />
      </div>
    </form>
    </div>
  </div>
</template>

<style scoped>
.classroom-create-form {
  display: flex;
  flex-direction: column;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  margin: auto;
  color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.form-header {
  margin-bottom: 20px;
  color: black;
  font-weight: bold;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.server-error {
  background: #ffe6e6;
  color: #a00;
  border: 1px solid #f5c2c2;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}

.field-error {
  color: #a00;
  font-size: 0.9rem;
  margin-top: 6px;
}
</style>