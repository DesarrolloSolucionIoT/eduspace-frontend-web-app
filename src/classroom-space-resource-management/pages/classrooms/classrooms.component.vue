<script>
import {ClassroomService} from "../../../shared/services/classroom.service.js";
import {TeacherService} from "../../../personal-data/services/teacher.service.js";
import ClassroomCard from "../../components/classrooms/classroom-card.component.vue";

export default {
  name: "ClassroomsPage",
  components: { ClassroomCard },
  data() {
    return {
      classrooms: [],
      classroomService: new ClassroomService(),
    };
  },
  async created() {
    await this.loadClassrooms();
  },
  methods: {
    async loadClassrooms() {
      try {
        const response = await this.classroomService.getAll();
        const teachers = await TeacherService.fetchTeachers();

        this.classrooms = response.data.map(
            classroom => {
              const teacher = teachers.find(t => t.id === classroom.teacherId);
              return {
                ...classroom,
                teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned',
              }
            }
        )
      } catch (error) {
        console.error("Error loading classrooms:", error);
      }
    },
    async deleteClassroom(id) {
      try {
        await this.classroomService.delete(id);
        this.classrooms = this.classrooms.filter(classroom => classroom.id !== id);
      } catch (error) {
        console.error("Error deleting classroom:", error);
      }
    },
    editClassroom(id) {
      this.$router.push({ name: "edit-classroom", params: { id } });
    },
    goToAdd() {
      this.$router.push({ name: 'add-classrooms' });
    },
  },
};
</script>

<template>
  <div class="classrooms-page">
    <div class="breadcrumb">
      <h4>Classrooms and Shared Spaces</h4>
      <i class="pi pi-chevron-right"></i>
      <h4>Classrooms</h4>
    </div>

    <div class="page-content">
      <div class="add-card">
        <div class="add-card-content">
          <div class="add-card-header">
            <div class="add-card-icon">
              <i class="pi pi-building"></i>
            </div>
            <div class="add-card-text">
              <h3>Add Classroom</h3>
              <p>Create a new learning space</p>
            </div>
          </div>
          <pv-button
              label="Add Classroom"
              icon="pi pi-plus"
              severity="warning"
              @click="goToAdd"
              class="add-button"
          />
        </div>
      </div>

      <div class="classrooms-grid">
        <classroom-card
            v-for="classroom in classrooms"
            :key="classroom.id"
            :classroom="classroom"
            @delete="deleteClassroom"
            @edit="editClassroom"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.classrooms-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.breadcrumb h4 {
  margin: 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 500;
}

.breadcrumb i {
  color: #adb5bd;
  font-size: 0.9rem;
}

.page-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  align-items: start;
}

.add-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: sticky;
  top: 2rem;
}

.add-card-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.add-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.add-card-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-card-icon i {
  font-size: 2rem;
  color: white;
}

.add-card-text h3 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.add-card-text p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.add-button {
  width: 100%;
  background: white;
  color: #667eea;
  border: none;
  font-weight: 600;
}

.add-button:hover {
  background: rgba(255, 255, 255, 0.9);
}

.classrooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .page-content {
    grid-template-columns: 1fr;
  }

  .add-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .classrooms-page {
    padding: 1rem;
  }

  .breadcrumb {
    flex-wrap: wrap;
  }

  .breadcrumb h4 {
    font-size: 1rem;
  }

  .classrooms-grid {
    grid-template-columns: 1fr;
  }
}
</style>