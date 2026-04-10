<script>
export default {
  name: "shared-space-create-and-edit",
  props: {
    shared_space: {
      type: Object,
      required: true,
      default: () => ({
        name: "",
        capacity: 0,
        description: "",
      }),
    },
    isCreateMode: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      form: { ...this.shared_space },
      sharedSpaceOptions: [
        { label: "Gym", value: "Gym" },
        { label: "Soccer Campus", value: "Soccer Campus" },
        { label: "Library", value: "Library" },
        { label: "Auditorium", value: "Auditorium" },
        { label: "Conference Room", value: "Conference Room" },
      ],
      capacityError: "",
    };
  },
  watch: {
    'form.name': 'validateCapacity',
    'form.capacity': 'validateCapacity',
  },
  methods: {
    validateCapacity() {
      const maxCapacity = {
        Gym: 20,
        "Soccer Campus": 30,
        Library: 20,
        Auditorium: 50,
        "Conference Room": 50,
      };
      if (!this.form.name || !this.form.capacity) {
        this.capacityError = "";
        return;
      }
      if (this.form.capacity > (maxCapacity[this.form.name] || 0)) {
        this.capacityError = `Capacity for ${this.form.name} must not exceed ${maxCapacity[this.form.name]}.`;
      } else {
        this.capacityError = "";
      }
    },
    save() {
      if (
        !this.form.name ||
        !this.form.capacity ||
        !this.form.description
      ) {
        this.capacityError = "Please fill in all fields.";
        return;
      }
      this.validateCapacity();
      if (this.capacityError) {
        return;
      }
      this.$emit("save", this.form);
    },
    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<template>
  <div class="shared-space-create-and-edit-container">
    <div class="breadcrumb" style="display: flex; align-items: center">
      <h4 style="margin-right: 20px">Classrooms and Shared Spaces</h4>
      <i class="pi pi-chevron-right"></i>
      <h4 style="margin-left: 20px">Shared Spaces</h4>
      <i class="pi pi-chevron-right"></i>
      <h4 style="margin-left: 20px">
        {{ isCreateMode ? "Add Shared Space" : "Edit Shared Space" }}
      </h4>
    </div>

    <div class="shared-space-create-form">
    <div class="form-header">
      <h2>{{ isCreateMode ? "Create Shared Space" : "Edit Shared Space" }}</h2>
    </div>
    <form @submit.prevent="save" class="form-grid">
      <div class="form-field">
        <pv-float-label>Name:</pv-float-label>
        <pv-dropdown
          v-model="form.name"
          :options="sharedSpaceOptions"
          option-label="label"
          option-value="value"
          placeholder="Select shared space"
          class="pv-input-text"
        />
      </div>

      <div class="form-field">
        <pv-float-label>Capacity:</pv-float-label>
        <pv-input-number
          v-model.number="form.capacity"
          :min="0"
          placeholder="Enter capacity"
        />
        <div v-if="capacityError" style="color: red; font-size: 0.9em; margin-top: 4px;">
          {{ capacityError }}
        </div>
      </div>

      <div class="form-field">
        <pv-float-label>Description:</pv-float-label>
        <pv-input-text
          v-model="form.description"
          placeholder="Enter description"
        />
      </div>

      <div class="form-actions">
        <pv-button type="submit" label="Save" class="p-button-success" :disabled="!!capacityError" />
        <pv-button
          type="button"
          label="Cancel"
          class="p-button-secondary"
          @click="cancel"
        />
      </div>
    </form>
    </div>
  </div>
</template>

<style scoped>
.shared-space-create-form {
  display: flex;
  flex-direction: column;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  margin-top: 50px;
  color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.form-header {
  color: black;
  font-weight: bold;
}

.form-grid {
  display: flex;
  flex-direction: column;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
</style>
