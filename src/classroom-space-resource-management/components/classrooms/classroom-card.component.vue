<script>
export default {
  name: "classroom-card",
  props: {
    classroom: {
      type: Object,
      required: true,
    },
  },
  methods: {
    async deleteClassroom() {
      try {
        this.$emit('delete', this.classroom.id);
      } catch (error) {
        console.error("Error deleting classroom:", error);
      }
    },
    async editClassroom() {
      this.$emit("edit", this.classroom.id);
    }
  },
};
</script>

<template>
  <div class="container">
    <div class="card border-round-xl shadow-2 p-3 h-full">
      <div class="text-xl font-semibold mb-2">{{ classroom.name }}</div>
      <div class="mb-2">
        <span class="font-medium text-600">Description: {{ classroom.description }}</span>
      </div>
      <div class="text-md text-gray-700">
        Teacher: {{ classroom.teacherName }}
      </div>
      <div class="flex align-items-center gap-2 mb-3">
        <i class="pi pi-box text-yellow-500"></i>
        <span>Classroom</span>
      </div>
      <div class="card-buttons">
        <pv-button label="Edit" severity="info" text raised class="w-full" @click="editClassroom"/>
        <pv-button label="Delete" severity="danger" text raised class="w-full" @click="deleteClassroom"/>
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
