<script>
import {ResourceService} from "../../services/resource.service.js";
import {ClassroomService} from "../../../shared/services/classroom.service.js";
import ResourceCard from "../../components/resources/resource-card.component.vue";

export default {
  name: "resource-list",
  components: { ResourceCard },
  data() {
    return {
      resources: [],
      classrooms: [],
      selectedClassroomId: null,
      resourceService: new ResourceService(),
      classroomService: new ClassroomService(),
    };
  },
  async created() {
    try {
      const response = await this.classroomService.getAll();
      this.classrooms = response.data;
    } catch (error) {
      console.error("Error loading classrooms:", error);
    }
  },
  methods: {
    async loadResources() {
      if (!this.selectedClassroomId) {
        this.resources = [];
        return;
      }
      try {
        const response = await this.resourceService.getAllByClassroomId(this.selectedClassroomId);
        this.resources = response.data;
      } catch (error) {
        console.error("Error loading resources:", error);
      }
    },
    async deleteResource(resource) {
      try {
        await this.resourceService.delete(resource.classroom.id, resource.id);
        this.resources = this.resources.filter(res => res.id !== resource.id);
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
    },
    editResource(resource) {
      this.$router.push({ name: "edit-resource", params: { classroomId: resource.classroom.id, resourceId: resource.id } });
    },
    goToAdd() {
      this.$router.push({ name: "add-resource" });
    },
  },
};
</script>

<template>
  <div class="resources-page">
    <div class="page-header">
      <h2>Resources Management</h2>
    </div>

    <div class="page-content">
      <div class="sidebar">
        <div class="filter-card">
          <div class="filter-header">
            <i class="pi pi-filter"></i>
            <h3>Filter by Classroom</h3>
          </div>
          <pv-select
              id="classroom-select"
              v-model="selectedClassroomId"
              :options="classrooms"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a Classroom"
              class="classroom-select"
              @change="loadResources"
          />
        </div>

        <div class="add-card">
          <div class="add-card-content">
            <div class="add-card-header">
              <div class="add-card-icon">
                <i class="pi pi-box"></i>
              </div>
              <div class="add-card-text">
                <h3>Add Resource</h3>
                <p>Create new equipment</p>
              </div>
            </div>
            <pv-button
                label="Add Resource"
                icon="pi pi-plus"
                severity="success"
                @click="goToAdd"
                class="add-button"
            />
          </div>
        </div>
      </div>

      <div class="resources-content">
        <div v-if="!selectedClassroomId" class="empty-state">
          <i class="pi pi-arrow-left" style="font-size: 3rem; color: #ccc;"></i>
          <h3>Select a classroom</h3>
          <p>Choose a classroom from the left to view its resources</p>
        </div>

        <div v-else-if="resources.length === 0" class="empty-state">
          <i class="pi pi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <h3>No resources found</h3>
          <p>This classroom doesn't have any resources yet</p>
        </div>

        <div v-else class="resources-grid">
          <resource-card
              v-for="resource in resources"
              :key="resource.id"
              :resource="resource"
              @delete="deleteResource(resource)"
              @edit="editResource(resource)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resources-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.page-header h2 {
  margin: 0;
  font-size: 2rem;
  color: #2c3e50;
}

.page-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  align-items: start;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 2rem;
}

.filter-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.filter-header i {
  color: #667eea;
  font-size: 1.25rem;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #495057;
  font-weight: 600;
}

.classroom-select {
  width: 100%;
}

.add-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
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
  color: #4facfe;
  border: none;
  font-weight: 600;
}

.add-button:hover {
  background: rgba(255, 255, 255, 0.9);
}

.resources-content {
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.empty-state h3 {
  margin: 0;
  color: #495057;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .page-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .resources-page {
    padding: 1rem;
  }

  .page-header h2 {
    font-size: 1.5rem;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>