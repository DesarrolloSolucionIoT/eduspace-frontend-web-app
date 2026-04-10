<script>
import {ClassroomService} from "../../../shared/services/classroom.service.js";

export default {
  name: "resource-create-and-edit",
  props: {
    resource: {
      type: Object,
      required: true,
    },
    isCreateMode: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      form: { ...this.resource },
      classrooms: [],
      resourceTypes: [
        'Projector',
        'Whiteboard',
        'Computer',
        'Desk',
        'Chair',
        'Smart TV',
        'Audio System'
      ],
      classroomService: new ClassroomService(),
    };
  },
  async created() {
    try {
      const response = await this.classroomService.getAll();
      this.classrooms = response.data;
    } catch (error) {
      console.error("Error loading classrooms for dropdown:", error);
    }
  },
  methods: {
    save() {
      if (!this.form.name || !this.form.kindOfResource || !this.form.classroomId) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'Por favor completa todos los campos.',
          life: 3000
        });
        return;
      }
      this.$emit("save", this.form);
    },
    cancel() {
      this.$emit("cancel");
    },
  },
  computed: {
    classroomOptions() {
      return this.classrooms.map(classroom => ({
        label: classroom.name,
        value: classroom.id,
      }));
    },
  },
};
</script>

<template>
  <div class="resource-create-form">
    <div class="form-header">
      <h2>{{ isCreateMode ? 'Create Resource' : 'Edit Resource' }}</h2>
    </div>
    <form @submit.prevent="save" class="form-grid">
      <div class="form-field">
        <label for="name">Name:</label>
        <pv-input-text id="name" v-model="form.name" placeholder="Enter resource name"/>
      </div>

      <div class="form-field">
        <label for="kind">Type of Resource:</label>
        <pv-select
            id="kind"
            v-model="form.kindOfResource"
            :options="resourceTypes"
            placeholder="Select a type"
            class="w-full"
        />
      </div>

      <div class="form-field">
        <label for="classroom">Assign to Classroom:</label>
        <pv-select
            id="classroom"
            v-model="form.classroomId"
            :options="classroomOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a classroom"
            class="w-full"
        />
      </div>

      <div class="form-actions">
        <pv-button type="submit" label="Save" class="p-button-success"/>
        <pv-button type="button" label="Cancel" class="p-button-secondary" @click="cancel"/>
      </div>
    </form>
  </div>
</template>

<style scoped>
.resource-create-form {
  max-width: 600px;
  margin: auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.form-header {
  margin-bottom: 2rem;
  text-align: center;
}
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}
</style>