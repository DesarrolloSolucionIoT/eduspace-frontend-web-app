<script>
import CreateAndEdit from "../../shared/components/create-and-edit.component.vue";
import {TeacherService} from "../services/teachers.service.js";
import {mapGetters} from "vuex";
import {ClassroomService} from "../../shared/services/classroom.service.js";
import {toDateOnlyString, toTimeOnlyString} from "../../shared/utils/date-utils.js";

export default {
  name: "meet-create-and-edit-dialog",
  components: { CreateAndEdit },
  props: {
    item: {
      type: Object,
      required: true,
    },
    visible: {
      type: Boolean,
      required: true,
    },
    edit: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      localItem: { ...this.item },
      submitted: false,
      teachers: [],
      classrooms: [],
      selectedTeachers: [],
      selectedTeachersError: null,
    };
  },
  computed: {
    ...mapGetters("user", ["userId", "currentUsername"]),

    teachersWithDisabled() {
      // When 2 teachers are already selected, disable other teacher options
      const max = 2;
      const selectedSet = new Set(this.selectedTeachers || []);
      return this.teachers.map((t) => ({
        ...t,
        disabled:
          this.selectedTeachers &&
          this.selectedTeachers.length >= max &&
          !selectedSet.has(t.id),
      }));
    },
  },
  created() {
    this.loadInitialData();

    // Watch `item` to sync incoming prop into localItem (deep & immediate)
    this.$watch(
      "item",
      (newItem) => {
        this.localItem = { ...newItem };

        if (newItem && newItem.start && typeof newItem.start === "string") {
          const [hours, minutes, seconds] = newItem.start.split(":");
          const startDate = new Date();
          startDate.setHours(hours, minutes, seconds || 0);
          this.localItem.start = startDate;
        }
        if (newItem && newItem.end && typeof newItem.end === "string") {
          const [hours, minutes, seconds] = newItem.end.split(":");
          const endDate = new Date();
          endDate.setHours(hours, minutes, seconds || 0);
          this.localItem.end = endDate;
        }

        if (newItem && newItem.id) {
          this.localItem.administratorId = newItem.administrator?.id || null;
          if (newItem.classroom) {
            this.localItem.classroomId = Number(newItem.classroom.id);
          }
        } else {
          this.localItem.administratorId = this.userId;
          this.localItem.classroomId = null;
        }
        this.formatTeachersForEdit();
      },
      { immediate: true, deep: true }
    );

    // Watch selectedTeachers to prevent selecting more than 2 and show an error
    this.$watch(
      "selectedTeachers",
      (newVal) => {
        if (newVal && newVal.length > 2) {
          this.selectedTeachers = newVal.slice(0, 2);
          this.selectedTeachersError =
            "Solo puedes invitar hasta 2 profesores.";
        } else {
          this.selectedTeachersError = null;
        }
      },
      { immediate: true }
    );
  },
  methods: {
    async loadInitialData() {
      try {
        await Promise.all([this.loadTeachers(), this.loadClassrooms()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    },
    async loadTeachers() {
      const response = await TeacherService.fetchTeachers();
      this.teachers = response.map((teacher) => ({
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
      }));
    },
    async loadClassrooms() {
      const classroomsService = new ClassroomService();
      const response = await classroomsService.getAll();
      this.classrooms = response.data.map((classroom) => ({
        id: Number(classroom.id),
        name: classroom.name,
      }));
    },
    formatTeachersForEdit() {
      if (Array.isArray(this.item.teachers) && this.item.teachers.length > 0) {
        this.selectedTeachers = this.item.teachers
          .map((teacher) =>
            typeof teacher === "object" ? teacher.id : teacher
          )
          .slice(0, 2);
        if (this.item.teachers.length > 2) {
          this.selectedTeachersError =
            "Solo puedes invitar hasta 2 profesores.";
        } else {
          this.selectedTeachersError = null;
        }
      } else {
        this.selectedTeachers = [];
        this.selectedTeachersError = null;
      }
    },
    onCancelRequested() {
      this.$emit("update:visible", false);
    },
    onSaveRequested() {
      this.submitted = true;
      if (this.selectedTeachers && this.selectedTeachers.length > 2) {
        this.selectedTeachersError = "Solo puedes invitar hasta 2 profesores.";
        return;
      }
      if (
        !this.localItem.title ||
        !this.localItem.date ||
        !this.localItem.start ||
        !this.localItem.end ||
        !this.localItem.classroomId
      ) {
        return;
      }

      const payload = {
        administratorId: this.localItem.administratorId,
        classroomId: this.localItem.classroomId,

        meetData: {
          title: this.localItem.title,
          description: this.localItem.description || "",
          date: toDateOnlyString(this.localItem.date),
          start: toTimeOnlyString(this.localItem.start),
          end: toTimeOnlyString(this.localItem.end),
        },
        teacherIds: this.selectedTeachers,
      };

      if (this.edit) {
        payload.meetData.meetingId = this.localItem.id;
        payload.meetData.administratorId = this.localItem.administratorId;
        payload.meetData.classroomId = this.localItem.classroomId;
      }

      this.$emit("save-requested", payload);
    },
  },
};
</script>

<template>
  <create-and-edit
    :entity="localItem"
    :visible="visible"
    size="standard"
    entity-name="Meet"
    @update:visible="(value) => $emit('update:visible', value)"
    @cancelled="onCancelRequested"
    @saved="onSaveRequested"
  >
    <template #content>
      <div class="meet-form">
        <div class="form-section">
          <div class="section-header">
            <i class="pi pi-info-circle"></i>
            <h3>Meeting Information</h3>
          </div>

          <div class="form-row">
            <div class="form-field full-width">
              <label for="title">Title <span class="required">*</span></label>
              <pv-input-text
                id="title"
                v-model="localItem.title"
                placeholder="Enter meeting title"
                :class="{ 'p-invalid': submitted && !localItem.title }"
              />
              <small v-if="submitted && !localItem.title" class="error-message">
                Title is required
              </small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field full-width">
              <label for="description">Description</label>
              <pv-input-text
                id="description"
                v-model="localItem.description"
                placeholder="Enter meeting description (optional)"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field full-width">
              <label for="classroom"
                >Classroom <span class="required">*</span></label
              >
              <pv-dropdown
                id="classroom"
                v-model="localItem.classroomId"
                :options="classrooms"
                optionLabel="name"
                optionValue="id"
                placeholder="Select a classroom"
                :class="{ 'p-invalid': submitted && !localItem.classroomId }"
                class="w-full"
              />
              <small
                v-if="submitted && !localItem.classroomId"
                class="error-message"
              >
                Classroom is required
              </small>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <i class="pi pi-calendar"></i>
            <h3>Date & Time</h3>
          </div>

          <div class="form-row">
            <div class="form-field full-width">
              <label for="date">Date <span class="required">*</span></label>
              <pv-date-picker
                id="date"
                v-model="localItem.date"
                showIcon
                fluid
                :showOnFocus="false"
                date-format="yy-mm-dd"
                placeholder="Select meeting date"
                :class="{ 'p-invalid': submitted && !localItem.date }"
              />
              <small v-if="submitted && !localItem.date" class="error-message">
                Date is required
              </small>
            </div>
          </div>

          <div class="form-row two-cols">
            <div class="form-field">
              <label for="start-time"
                >Start Time <span class="required">*</span></label
              >
              <pv-date-picker
                id="start-time"
                v-model="localItem.start"
                timeOnly
                placeholder="Start time"
                :class="{ 'p-invalid': submitted && !localItem.start }"
              />
              <small v-if="submitted && !localItem.start" class="error-message">
                Start time is required
              </small>
            </div>
            <div class="form-field">
              <label for="end-time"
                >End Time <span class="required">*</span></label
              >
              <pv-date-picker
                id="end-time"
                v-model="localItem.end"
                timeOnly
                placeholder="End time"
                :class="{ 'p-invalid': submitted && !localItem.end }"
              />
              <small v-if="submitted && !localItem.end" class="error-message">
                End time is required
              </small>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <i class="pi pi-users"></i>
            <h3>Participants</h3>
          </div>

          <div class="form-row">
            <div class="form-field full-width">
              <label for="invite">Invite Teachers</label>
              <pv-multi-select
                id="invite"
                v-model="selectedTeachers"
                :options="teachersWithDisabled"
                option-label="name"
                option-value="id"
                placeholder="Select teachers to invite"
                class="w-full"
                :class="{ 'p-invalid': submitted && selectedTeachersError }"
                display="chip"
              />
              <small v-if="selectedTeachersError" class="error-message">{{
                selectedTeachersError
              }}</small>
              <small class="field-hint">
                You can invite multiple teachers to this meeting
              </small>
            </div>
          </div>
        </div>
      </div>
    </template>
  </create-and-edit>
</template>

<style scoped>
.meet-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #dee2e6;
}

.section-header i {
  color: #667eea;
  font-size: 1.25rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #495057;
  font-weight: 600;
}

.form-row {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row.two-cols {
  grid-template-columns: 1fr 1fr;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #495057;
}

.required {
  color: #dc3545;
  font-weight: 600;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.field-hint {
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
  margin-top: 0.25rem;
}

:deep(.p-invalid) {
  border-color: #dc3545;
}

@media (max-width: 768px) {
  .form-row.two-cols {
    grid-template-columns: 1fr;
  }

  .form-section {
    padding: 1rem;
  }
}
</style>
