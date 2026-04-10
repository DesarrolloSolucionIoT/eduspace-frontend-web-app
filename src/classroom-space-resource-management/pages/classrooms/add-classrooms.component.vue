<script>
import {ClassroomService} from "../../../shared/services/classroom.service.js";
import ClassroomCreateAndEdit from "../../components/classrooms/classroom-create-and-edit.component.vue";

export default {
  name: "add-classroom",
  components: { ClassroomCreateAndEdit },
  data() {
    return {
      classroom: {
        name: '',
        description: '',
        teacherId: null,
      },
      classroomService: new ClassroomService(),
      serverError: null,
      isSaving: false
    };
  },
  methods: {
    async saveClassroom(classroomData) {
      this.isSaving = true;
      try {
        const { teacherId, name, description } = classroomData;

        if (!teacherId) {
          this.$toast.add({
            severity: 'warn',
            summary: 'Atención',
            detail: 'Debes seleccionar un profesor.',
            life: 3000
          });
          return;
        }

        const payload = { name, description };

        await this.classroomService.create(payload, teacherId);

        this.$toast.add({severity: 'success', summary: 'Éxito', detail: 'Aula creada correctamente', life: 3000});
        this.serverError = null;
        this.$router.push({ name: 'admin-classrooms' });
      } catch (error) {
        // Detailed logging for debugging
        console.error("Error creating classroom:", error);

        // Helper to extract a useful message from various backend shapes
        const extractServerMessage = (err) => {
          const resp = err?.response;
          if (resp && resp.data) {
            const d = resp.data;
            if (typeof d === 'string' && d.trim()) return d;
            if (d.message && typeof d.message === 'string') return d.message;
            if (d.errors) {
              // errors might be array, object, or string
              if (typeof d.errors === 'string') return d.errors;
              if (Array.isArray(d.errors)) return d.errors.join(', ');
              if (typeof d.errors === 'object') {
                try {
                  const vals = Object.values(d.errors).flat().filter(Boolean);
                  if (vals.length) return vals.join(', ');
                } catch {
                  // fallthrough
                }
              }
            }
            try {
              const s = JSON.stringify(d);
              if (s && s !== '{}') return s;
            } catch {
              // ignore
            }
          }

          // Axios default message often looks like: "Request failed with status code 500"
          if (err?.message) return err.message;

          if (err?.response?.status) return `Server error (${err.response.status})`;

          return 'Server error';
        };

        let rawMessage = extractServerMessage(error);

        // Map some known backend english messages to friendly Spanish
        const mapping = [
          { re: /Classroom with the same title already exist/i, msg: 'Ya existe un aula con ese nombre.' },
        ];
        for (const m of mapping) {
          if (m.re.test(rawMessage)) {
            rawMessage = m.msg;
            break;
          }
        }

        // Map axios generic "Request failed with status code 500" to a friendly Spanish message
        const axiosStatusMatch = rawMessage && rawMessage.match(/Request failed with status code (\d{3})/i);
        if (axiosStatusMatch) {
          const statusCode = axiosStatusMatch[1];
          if (statusCode === '500') {
            rawMessage = 'Error del servidor (500). Intenta más tarde.';
          } else {
            rawMessage = `Error del servidor (${statusCode}).`;
          }
        }

        this.serverError = rawMessage;
      } finally {
        this.isSaving = false;
      }
    },
    cancel() {
      this.$router.push({ name: 'admin-classrooms' });
    },
    clearServerError() {
      this.serverError = null;
    }
  },
};
</script>

<template>
  <classroom-create-and-edit
      :classroom="classroom"
      :isCreateMode="true"
      :server-error="serverError"
      @clear-server-error="clearServerError"
      @save="saveClassroom"
      :loading="isSaving"
      @cancel="cancel"/>
</template>

<style scoped>
</style>