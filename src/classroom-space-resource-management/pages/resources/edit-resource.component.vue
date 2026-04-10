<script>
import {ResourceService} from "../../services/resource.service.js";
import ResourceCreateAndEdit from "../../components/resources/resource-create-and-edit.component.vue";

export default {
  name: "edit-resource",
  components: { ResourceCreateAndEdit },
  data() {
    return {
      resource: null,
      classroomId: null,
      resourceId: null,
      resourceService: new ResourceService(),
    };
  },
  async created() {
    this.classroomId = this.$route.params.classroomId;
    this.resourceId = this.$route.params.resourceId;

    if (this.classroomId && this.resourceId) {
      try {
        const response = await this.resourceService.getById(this.classroomId, this.resourceId);

        if (response.data && response.data.classroom) {
          this.resource = {
            id: response.data.id,
            name: response.data.name,
            kindOfResource: response.data.kindOfResource,
            classroomId: response.data.classroom.id
          };
        } else {
          console.error("Error: The API response does not have the expected format.", response.data);
        }
      } catch (error) {
        console.error("Critical error during API call:", error);
      }
    } else {
      console.error("Error: Required IDs not found in the route.");
    }
  },
  methods: {
    async updateResource(resourceData) {
      try {
        await this.resourceService.update(this.classroomId, this.resourceId, resourceData);
        this.$toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Recurso actualizado correctamente.',
          life: 3000
        });
        this.$router.push({ name: 'resource-list' });
      } catch (error) {
        console.error("Error updating resource:", error);
      }
    },
    cancel() {
      this.$router.push({ name: 'resource-list' });
    },
  },
};
</script>

<template>
  <div v-if="resource">
    <resource-create-and-edit
        :resource="resource"
        :isCreateMode="false"
        @save="updateResource"
        @cancel="cancel"
    />
  </div>
  <div v-else>
    <p>Loading resource data...</p>
  </div>
</template>