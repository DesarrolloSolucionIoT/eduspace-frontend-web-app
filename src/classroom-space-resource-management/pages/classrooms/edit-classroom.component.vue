<script>
import {ClassroomService} from "../../../shared/services/classroom.service.js";
import ClassroomCreateAndEdit from "../../components/classrooms/classroom-create-and-edit.component.vue";

export default {
  name: "edit-classroom",
  components: { ClassroomCreateAndEdit },
  data() {
    return {
      classroom: null,
      classroomId: null,
      classroomService: new ClassroomService(),
    };
  },
  async created() {
    this.classroomId = this.$route.params.id;
    if (this.classroomId) {
      try {
        const response = await this.classroomService.getById(this.classroomId);
        this.classroom = response.data;
      } catch (error) {
        console.error("Error loading classroom:", error);
      }
    }
  },
  methods: {
    async updateClassroom(classroomData) {
      try {
        await this.classroomService.update(this.classroomId, classroomData);
        this.$toast.add({severity: 'success', summary: 'Éxito', detail: 'Aula actualizada correctamente', life: 3000});
        this.$router.push("/dashboard-admin/classrooms-shared-spaces");
      } catch (error) {
        console.error("Error updating classroom:", error);
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al actualizar: ' + error.message,
          life: 3000
        });
      }
    },
    cancel() {
      this.$router.push("/dashboard-admin/classrooms-shared-spaces");
    },
  },
};
</script>

<template>
  <div v-if="classroom">
    <classroom-create-and-edit
        :classroom="classroom"
        :isCreateMode="false"
        @save="updateClassroom"
        @cancel="cancel"
    />
  </div>
  <div v-else>
    <p>Loading classroom data...</p>
  </div>
</template>

<style scoped></style>