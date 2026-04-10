<script>
import {SharedAreaService} from "../../services/shared-area.service.js";
import SharedSpaceCard from "../../components/shared-spaces/shared-space-card.component.vue";

export default {
  name: "shared-spaces",
  components: { SharedSpaceCard },
  data() {
    return {
      shared_spaces: [],
      sharedAreaService: new SharedAreaService(),
    };
  },
  async created() {
    await this.loadAreas();
  },
  methods: {
    async loadAreas() {
      try {
        const response = await this.sharedAreaService.getAll();
        this.shared_spaces = response.data;
      } catch (error) {
        console.error("Error loading shared areas:", error);
      }
    },
    async deleteSharedSpace(id) {
      try {
        await this.sharedAreaService.delete(id);
        this.shared_spaces = this.shared_spaces.filter(
            (space) => space.id !== id
        );
      } catch (error) {
        console.error("Error deleting shared area:", error);
      }
    },
    editSharedSpace(id) {
      this.$router.push({ name: "edit-shared-space", params: { id } });
    },
    goToAdd() {
      this.$router.push({ name: "add-shared-space" });
    },
  },
};
</script>

<template>
  <div class="shared-spaces-page">
    <div class="breadcrumb">
      <h4>Classrooms and Shared Spaces</h4>
      <i class="pi pi-chevron-right"></i>
      <h4>Shared Spaces</h4>
    </div>

    <div class="page-content">
      <div class="add-card">
        <div class="add-card-content">
          <div class="add-card-header">
            <div class="add-card-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="add-card-text">
              <h3>Add Shared Area</h3>
              <p>Create a new common space</p>
            </div>
          </div>
          <pv-button
              label="Add Shared Area"
              icon="pi pi-plus"
              severity="warning"
              @click="goToAdd"
              class="add-button"
          />
        </div>
      </div>

      <div class="spaces-grid">
        <shared-space-card
            v-for="shared_space in shared_spaces"
            :key="shared_space.id"
            :shared_space="shared_space"
            @delete="deleteSharedSpace"
            @edit="editSharedSpace"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shared-spaces-page {
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
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
  color: #f5576c;
  border: none;
  font-weight: 600;
}

.add-button:hover {
  background: rgba(255, 255, 255, 0.9);
}

.spaces-grid {
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
  .shared-spaces-page {
    padding: 1rem;
  }

  .breadcrumb {
    flex-wrap: wrap;
  }

  .breadcrumb h4 {
    font-size: 1rem;
  }

  .spaces-grid {
    grid-template-columns: 1fr;
  }
}
</style>