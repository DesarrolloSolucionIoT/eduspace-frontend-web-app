<script>
const defaultStyle = { width: '400px' };

export default {
  name: "create-and-edit",
  props: {
    entity: {
      type: Object,
      required: true
    },
    visible: {
      type: Boolean,
      required: true
    },
    entityName: {
      type: String,
      required: true
    },
    edit: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'default'
    }
  },
  methods: {
    onCancel() {
      this.$emit('update:visible', false); // Emitir el evento para que el padre cierre el diálogo
      this.$emit('canceled');
    },
    onSave() {
      this.$emit('saved', this.entity);
    },
    getHeaderTitle() {
      return `${this.edit ? 'Edit' : 'New'} ${this.entityName}`;
    },
    getSubmitLabel() {
      return this.edit ? 'Update' : 'Create';
    },
    getDialogStyle() {
      let dialogStyle = defaultStyle;
      dialogStyle = this.size === 'standard' ? { width: '600px' } : dialogStyle;
      dialogStyle = this.size === 'large' ? { width: '900px' } : dialogStyle;
      return dialogStyle;
    }
  }
}
</script>

<template>
  <pv-dialog
      :visible="visible"
      :modal="true"
      :style="getDialogStyle()"
      class="p-fluid"
      :header="getHeaderTitle()"
      @update:visible="$emit('update:visible', $event)"
  >
    <slot name="content"></slot>
    <template #footer>
      <div class="flex justify-content-end">
        <pv-button type="button" :label="getSubmitLabel()" class="p-button-text" icon="pi pi-check" @click="onSave" />
        <pv-button type="button" label="Cancel" severity="secondary" class="p-button-text" icon="pi pi-times"
                   @click="onCancel" />
      </div>
    </template>
  </pv-dialog>
</template>

<style scoped>
/* Estilos específicos */
</style>
