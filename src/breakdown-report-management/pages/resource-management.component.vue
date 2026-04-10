<template>
  <div class="resource-management">
    <h1 class="centered-title">Resources for {{ classroomName }}</h1>

    <div v-if="loading" class="loading">
      Cargando recursos...
    </div>

    <div v-else-if="resources.length > 0" class="resource-cards">
      <div
          v-for="resource in resources"
          :key="resource.id"
          class="resource-card"
      >
        <h2 class="resource-title">{{ resource.name }}</h2>
        <p class="resource-kind">Type: {{ resource.kindOfResource }}</p>
        <p class="resource-classroom">Classroom: {{ resource.classroom?.name || classroomName }}</p>
        <div class="button-container">
          <pv-button
              label="Report Resource"
              @click="goToReport(resource.id)"
              class="report-resource-button"
          />
        </div>
      </div>
    </div>

    <p v-else class="no-resources">No resources available for this classroom.</p>
  </div>
</template>

<script>
import {ResourceService} from "../../classroom-space-resource-management/services/resource.service.js";
import {ClassroomService} from "../../shared/services/classroom.service.js";

export default {
  name: 'ResourceManagement',
  data() {
    return {
      resources: [],
      classroomId: this.$route.params.classroomId,
      classroomName: '',
      loading: true,
      resourceService: new ResourceService(),
      classroomService: new ClassroomService()
    };
  },
  created() {
    this.loadClassroomName();
    this.loadResources();
  },
  methods: {
    async loadResources() {
      this.loading = true;
      try {
        const response = await this.resourceService.getAllByClassroomId(this.classroomId);
        this.resources = response.data;
      } catch (error) {
        console.error("Error loading resources", error);
      } finally {
        this.loading = false;
      }
    },
    async loadClassroomName() {
      try {
        const response = await this.classroomService.getById(this.classroomId);
        this.classroomName = response.data.name;
      } catch (error) {
        console.error("Error loading classroom name", error);
        this.classroomName = `Classroom ${this.classroomId}`;
      }
    },
    goToReport(resourceId) {
      this.$router.push({
        name: 'report-resource',
        params: {
          classroomId: this.classroomId,
          resourceId: resourceId
        }
      });
    }
  }
};
</script>

<style scoped>
.resource-management {
  padding: 20px;
}

.centered-title {
  text-align: center;
  margin-bottom: 20px;
}

.resource-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.resource-card {
  width: 250px;
  border: 1px solid #0CC0DF;
  border-radius: 50px;
  padding: 1.5rem;
  box-shadow: 0 4px 28px rgba(12, 192, 223, 0.28);
  transition: transform 0.2s;
}

.resource-card:hover {
  transform: translateY(-10px);
}

.resource-title {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.resource-kind {
  text-align: center;
  color: #333;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.report-resource-button {
  background-color: #ffcc00;
  color: #000;
  border-radius: 50px;
  padding: 0.5rem 1rem;
  text-transform: uppercase;
}

.report-resource-button:hover {
  background-color: #ffdb4d;
}
</style>