<template>
  <div class="teachers-management-page">
    <div class="page-header">
      <h1>Teachers Management</h1>
      <pv-button
        label="Add Teacher"
        icon="pi pi-plus"
        @click="showAddDialog = true"
        class="add-teacher-button"
      />
    </div>

    <div v-if="loading" class="loading-container">
      <pv-progress-spinner />
      <p>Loading teachers...</p>
    </div>

    <div v-else-if="teachers.length === 0" class="empty-state">
      <i class="pi pi-users" style="font-size: 4rem; color: #ccc"></i>
      <h3>No teachers found</h3>
      <p>Start by adding your first teacher</p>
    </div>

    <div v-else class="teacher-grid">
      <TeacherCardComponent
        v-for="teacher in teachers"
        :key="teacher.id"
        :teacher="teacher"
        @view="viewTeacherDetails"
        @edit="editTeacher"
        @delete="deleteTeacher"
      />
    </div>

    <pv-dialog
      v-model:visible="showAddDialog"
      header="Add New Teacher"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '950px' }"
      :draggable="false"
    >
      <AddTeacherFormComponent
        @save="handleAddTeacher"
        @cancel="showAddDialog = false"
        :loading="isSaving"
      />
    </pv-dialog>

    <pv-dialog
      v-model:visible="showDetailsDialog"
      header="Teacher Details"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '600px' }"
      :draggable="false"
    >
      <div v-if="selectedTeacher" class="teacher-details">
        <div class="detail-row">
          <span class="detail-label">Full Name:</span>
          <span class="detail-value"
            >{{ selectedTeacher.firstName }}
            {{ selectedTeacher.lastName }}</span
          >
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">{{ selectedTeacher.email }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">DNI:</span>
          <span class="detail-value">{{ selectedTeacher.dni }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">{{ selectedTeacher.phone }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Address:</span>
          <span class="detail-value">{{ selectedTeacher.address }}</span>
        </div>
      </div>
      <template #footer>
        <pv-button
          label="Close"
          icon="pi pi-times"
          @click="showDetailsDialog = false"
          severity="secondary"
        />
      </template>
    </pv-dialog>

    <pv-dialog
      v-model:visible="showEditDialog"
      header="Edit Teacher"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '950px' }"
      :draggable="false"
    >
      <AddTeacherFormComponent
        :teacher="selectedTeacher"
        :is-edit="true"
        @save="handleEditTeacher"
        @cancel="showEditDialog = false"
        :loading="isSaving"
      />
    </pv-dialog>

    <pv-dialog
      v-model:visible="showDeleteDialog"
      header="Confirm Delete"
      :modal="true"
      :closable="true"
      :style="{ width: '90vw', maxWidth: '450px' }"
      :draggable="false"
    >
      <div v-if="teacherToDelete" class="delete-confirmation">
        <p>
          Are you sure you want to delete the teacher
          <strong
            >{{ teacherToDelete.firstName }}
            {{ teacherToDelete.lastName }}</strong
          >?
        </p>
        <p class="warning-text">
          <i class="pi pi-exclamation-triangle"></i>
          Note: This teacher cannot be deleted if they are assigned to any
          meetings.
        </p>
        <p class="warning-text">This action cannot be undone.</p>
      </div>
      <template #footer>
        <pv-button
          label="Cancel"
          icon="pi pi-times"
          @click="showDeleteDialog = false"
          severity="secondary"
        />
        <pv-button
          label="Delete"
          icon="pi pi-trash"
          @click="confirmDeleteTeacher"
          severity="danger"
        />
      </template>
    </pv-dialog>

    <pv-toast />
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import TeacherCardComponent from "../../personal-data/components/teacher-card.component.vue";
import AddTeacherFormComponent from "../../personal-data/components/add-teacher-form.component.vue";
import {TeacherService} from "../../personal-data/services/teacher.service.js";

export default {
  name: "teachers-management",
  components: {
    TeacherCardComponent,
    AddTeacherFormComponent,
  },
  data() {
    return {
      teachers: [],
      selectedTeacher: null,
      showAddDialog: false,
      showDetailsDialog: false,
      showEditDialog: false,
      showDeleteDialog: false,
      teacherToDelete: null,
      loading: false,
      isSaving: false
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),
  },
  async created() {
    await this.loadTeachers();
  },
  methods: {
    async loadTeachers() {
      this.loading = true;
      try {
        this.teachers = await TeacherService.fetchTeachers();
      } catch (error) {
        this.$toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message || "Failed to load teachers",
          life: 4000,
        });
      } finally {
        this.loading = false;
      }
    },

    async handleAddTeacher(teacherData) {
      this.isSaving = true;
      try {
        await TeacherService.addTeacher(teacherData);
        this.$toast.add({
          severity: "success",
          summary: "Success",
          detail: "Teacher added successfully",
          life: 3000,
        });
        this.showAddDialog = false;
        await this.loadTeachers();
      } catch (error) {
        this.$toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message || "Failed to add teacher",
          life: 4000,
        });
      } finally {
        this.isSaving = false;
      }
    },

    async viewTeacherDetails(teacherId) {
      try {
        this.selectedTeacher = await TeacherService.fetchTeacherById(teacherId);
        this.showDetailsDialog = true;
      } catch (error) {
        this.$toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message || "Failed to load teacher details",
          life: 4000,
        });
      }
    },

    async editTeacher(teacher) {
      this.selectedTeacher = teacher;
      this.showEditDialog = true;
    },

    async deleteTeacher(teacherId) {
      const teacher = this.teachers.find((t) => t.id === teacherId);
      if (teacher) {
        this.teacherToDelete = teacher;
        this.showDeleteDialog = true;
      }
    },

    async handleEditTeacher(teacherData) {
      this.isSaving = true;
      try {
        await TeacherService.updateTeacher(
          this.selectedTeacher.id,
          teacherData
        );
        this.$toast.add({
          severity: "success",
          summary: "Success",
          detail: "Teacher updated successfully",
          life: 3000,
        });
        this.showEditDialog = false;
        this.selectedTeacher = null;
        await this.loadTeachers();
      } catch (error) {
        this.$toast.add({
          severity: "error",
          summary: "Error",
          detail: error.message || "Failed to update teacher",
          life: 4000,
        });
      } finally {
        this.isSaving = false;
      }
    },

    async confirmDeleteTeacher() {
      try {
        await TeacherService.deleteTeacher(this.teacherToDelete.id);
        this.$toast.add({
          severity: "success",
          summary: "Success",
          detail: "Teacher deleted successfully",
          life: 3000,
        });
        this.showDeleteDialog = false;
        this.teacherToDelete = null;
        await this.loadTeachers();
      } catch (error) {
        const errorMessage =
          error.message ||
          error.response?.data?.message ||
          "Failed to delete teacher";

        if (
          errorMessage.includes("foreign key constraint") ||
          errorMessage.includes("Cannot delete or update a parent row") ||
          error.response?.status === 409
        ) {
          this.$toast.add({
            severity: "warn",
            summary: "Cannot Delete Teacher",
            detail:
              "This teacher cannot be deleted because they are assigned to meetings. Please remove them from all meetings first.",
            life: 6000,
          });
        } else {
          this.$toast.add({
            severity: "error",
            summary: "Error",
            detail: errorMessage,
            life: 4000,
          });
        }
      }
    },
  },
};
</script>

<style scoped>
.teachers-management-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.page-header h1 {
  margin-right: 10px;
  font-size: 2rem;
  color: #2c3e50;
}

.add-teacher-button {
  background-color: #34a7c1;
  border-color: #34a7c1;
}

.add-teacher-button:hover {
  background-color: #2a8ba0;
  border-color: #2a8ba0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.loading-container p {
  color: #6c757d;
  font-size: 1.1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  color: #495057;
}

.empty-state p {
  margin: 0;
  color: #6c757d;
}

.teacher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.teacher-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.detail-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.delete-confirmation {
  text-align: center;
  padding: 1rem 0;
}

.delete-confirmation p {
  margin: 1rem 0;
  font-size: 1.1rem;
  color: #495057;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warning-text i {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .teachers-management-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .add-teacher-button {
    width: 100%;
  }

  .teacher-grid {
    grid-template-columns: 1fr;
  }
}
</style>
