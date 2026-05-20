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
        this.capacityError = this.$t('classroomSpace.sharedSpaces.validation.capacityExceeded', { name: this.form.name, max: maxCapacity[this.form.name] });
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
        this.capacityError = this.$t('classroomSpace.common.validation.fillAllFields');
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
      <h4 style="margin-right: 20px">{{ $t('classroomSpace.common.breadcrumbRoot') }}</h4>
      <i class="pi pi-chevron-right"></i>
      <h4 style="margin-left: 20px">{{ $t('classroomSpace.sharedSpaces.title') }}</h4>
      <i class="pi pi-chevron-right"></i>
      <h4 style="margin-left: 20px">
        {{ isCreateMode ? $t('classroomSpace.sharedSpaces.addSingular') : $t('classroomSpace.sharedSpaces.editSingular') }}
      </h4>
    </div>

    <div class="shared-space-create-form">
    <div class="form-header">
      <h2>{{ isCreateMode ? $t('classroomSpace.sharedSpaces.createSingular') : $t('classroomSpace.sharedSpaces.editSingular') }}</h2>
    </div>
    <form @submit.prevent="save" class="form-grid">
      <div class="form-field">
        <pv-float-label>{{ $t('common.name') }}:</pv-float-label>
        <pv-dropdown
          v-model="form.name"
          :options="sharedSpaceOptions"
          option-label="label"
          option-value="value"
          :placeholder="$t('classroomSpace.sharedSpaces.selectPlaceholder')"
          class="pv-input-text"
        />
      </div>

      <div class="form-field">
        <pv-float-label>{{ $t('classroomSpace.sharedSpaces.capacity') }}:</pv-float-label>
        <pv-input-number
          v-model.number="form.capacity"
          :min="0"
          :placeholder="$t('classroomSpace.sharedSpaces.capacityPlaceholder')"
        />
        <div v-if="capacityError" style="color: red; font-size: 0.9em; margin-top: 4px;">
          {{ capacityError }}
        </div>
      </div>

      <div class="form-field">
        <pv-float-label>{{ $t('common.description') }}:</pv-float-label>
        <pv-input-text
          v-model="form.description"
          :placeholder="$t('classroomSpace.common.descriptionPlaceholder')"
        />
      </div>

      <div class="form-actions">
        <pv-button type="submit" :label="$t('common.save')" class="p-button-success" :disabled="!!capacityError" />
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
