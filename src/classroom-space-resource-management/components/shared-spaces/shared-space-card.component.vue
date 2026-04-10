<script>
export default {
  name: "shared-space-card",
  props: {
    shared_space: {
      type: Object,
      required: true,
    },
  },
  methods: {
    async deleteSharedSpace() {
      try {
        await this.$emit("delete", this.shared_space.id);
      } catch (error) {
        console.error("Error deleting shared space:", error);
      }
    },
    async editSharedSpace() {
      try {
        await this.$emit("edit", this.shared_space.id);
      } catch (error) {
        console.error("Error editing shared space:", error);
      }
    },
  },
};
</script>

<template>
  <div class="container">
    <div class="card border-round-xl shadow-2 p-3 h-full">
      <div class="text-xl font-semibold mb-2">{{ shared_space.name }}</div>
      <div class="mb-2">
        <span class="font-medium text-600"
          >Capacity: {{ shared_space.capacity }}</span
        >
      </div>
      <div class="mb-2">
        <span class="font-medium text-600"
          >Description: {{ shared_space.description }}</span
        >
      </div>
      <div class="flex align-items-center gap-2 mb-3">
        <i class="pi pi-box text-yellow-500"></i>
        <span>equipment</span>
      </div>
      <div class="card-buttons">
        <pv-button label="Edit" severity="info" text raised class="w-full" @click="editSharedSpace"/>
        <pv-button label="Delete" severity="danger" text raised class="w-full" @click="deleteSharedSpace"/>
      </div>

    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100%;
  align-content: space-between;
}

.card {
  width: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: #ffffff;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.card-buttons {
  display: flex;
  gap: 10px;
  margin-top: 1rem;
}
</style>
