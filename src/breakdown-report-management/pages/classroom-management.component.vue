<template>
  <div class="classroom-management">
    <h1 class="centered-title">Make a breakdown report</h1>

    <div v-if="!loading && filteredClassrooms.length > 0" class="classroom-cards">
      <div
          v-for="classroom in filteredClassrooms"
          :key="classroom.id"
          class="classroom-card"
      >
        <div class="image-container">
          <img
              :src="defaultClassroomImage"
              @error="handleImageError"
              alt="Classroom Image"
              class="classroom-image"
          />
        </div>

        <div class="card-content">
          <h2 class="classroom-name">{{ classroom.name || 'No name available' }}</h2>
          <p class="classroom-description">{{ classroom.description || 'No description available' }}</p>
          <div class="button-container">
            <pv-button
                label="View Resources"
                @click="goToClassroomResources(classroom.id)"
                class="view-resources-button"
            />
          </div>
        </div>
      </div>
    </div>

    <p v-if="!loading && filteredClassrooms.length === 0" class="no-classrooms">
      You do not have any classrooms assigned.
    </p>

    <p v-if="loading" class="no-classrooms">
      Loading classrooms...
    </p>
  </div>
</template>

<script>
import {ClassroomService} from "../../shared/services/classroom.service.js";
import {mapGetters} from "vuex";

export default {
  name: 'ClassroomManagement',
  data() {
    return {
      allClassrooms: [],
      classroomService: new ClassroomService(),
      loading: true,
      defaultClassroomImage: "https://i0.wp.com/mirincondeaprendizaje.com/wp-content/uploads/2019/08/school-2648668_960_720.jpg?resize=768%2C508&ssl=1",
      fallbackImage: "https://placehold.co/600x400/e2e8f0/1e293b?text=EduSpace+Classroom"
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),

    filteredClassrooms() {
      if (!this.userId) return [];
      return this.allClassrooms.filter(
          classroom => String(classroom.teacherId) === String(this.userId)
      );
    }
  },
  created() {
    this.loadAllClassrooms();
  },
  methods: {
    async loadAllClassrooms() {
      this.loading = true;
      try {
        const response = await this.classroomService.getAll();
        this.allClassrooms = response.data;
      } catch (error) {
        console.error("Error loading classrooms", error);
      } finally {
        this.loading = false;
      }
    },
    goToClassroomResources(classroomId) {
      this.$router.push({
        name: 'teacher-resource-management',
        params: { classroomId }
      });
    },
    handleImageError(event) {
      event.target.src = this.fallbackImage;
    }
  }
};
</script>

<style scoped>
.classroom-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.centered-title {
  text-align: center;
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.classroom-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  padding: 0.5rem;
  width: 100%;
}

.classroom-card {
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 28px rgba(12, 192, 223, 0.28);
  transition: transform 0.2s ease;
  border: 1px solid #0CC0DF;
}

.classroom-card:hover {
  transform: translateY(-10px);
}

.image-container {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.classroom-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.classroom-card:hover .classroom-image {
  transform: scale(1.1);
}

.card-content {
  padding: 1rem;
}

.classroom-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  text-align: center;
}

.classroom-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
  text-align: center;
  line-height: 1.4;
}

.button-container {
  display: flex;
  justify-content: center;
}

:deep(.view-resources-button) {
  background-color: #ffcc00;
  border: none;
  color: #000;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  transition: all 0.2s ease;
}

:deep(.view-resources-button:hover) {
  background-color: #ffdb4d;
  transform: translateY(-2px);
}

.no-classrooms {
  text-align: center;
  color: #666;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .classroom-cards {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .centered-title {
    font-size: 1.8rem;
  }
}
</style>