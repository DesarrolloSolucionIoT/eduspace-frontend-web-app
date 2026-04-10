<script>
import {SharedAreaService} from "../../services/shared-area.service.js";
import SharedSpaceCreateAndEdit from "../../components/shared-spaces/shared-space-create-and-edit.component.vue";

export default {
  name: "edit-shared-space",
  components: { SharedSpaceCreateAndEdit },
  data() {
    return {
      shared_space: null,
      spaceId: null,
      sharedAreaService: new SharedAreaService(),
    };
  },
  async created() {
    this.spaceId = this.$route.params.id;
    if (this.spaceId) {
      const response = await this.sharedAreaService.getById(this.spaceId);
      this.shared_space = response.data;
    }
  },
  methods: {
    async updateSharedSpace(spaceData) {
      await this.sharedAreaService.update(this.spaceId, spaceData);
      this.$router.push("/dashboard-admin/classrooms-shared-spaces/shared-spaces");
    },
    cancel() {
      this.$router.push("/dashboard-admin/classrooms-shared-spaces/shared-spaces");
    },
  },
};
</script>

<template>
  <div v-if="shared_space">
    <shared-space-create-and-edit
        :shared_space="shared_space"
        :isCreateMode="false"
        @save="updateSharedSpace"
        @cancel="cancel"
    />
  </div>
</template>