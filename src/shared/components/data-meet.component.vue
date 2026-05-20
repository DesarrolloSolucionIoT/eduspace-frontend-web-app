<script>
import {FilterMatchMode} from "@primevue/core";

export default {
  name: "data-meet",
  inheritAttrs: false,
  props: {
    items: { type: Array, required: true },
    title: { type: { singular: '', plural: ''}, required: true },
    dynamic: { type: Boolean, default: false },
    columns: { type: Array, default: () => []}
  },
  data() {
    return {
      selectedItems: [],
      filters: null
    }
  },
  methods: {
    initFilters() {
      this.filters = { global: { value: null, matchMode: FilterMatchMode.CONTAINS } };
    },
    newItem() {
      this.$emit('new-item-requested');
    },
    confirmDeleteSelected() {
      this.$confirm.require({
        message:      this.$t('shared.dataMeet.confirmDeleteSelected', { items: this.title.plural }),
          header:       this.$t('shared.dataMeet.confirmation'),
          icon:         'pi pi-exclamation-triangle',
          rejectClass:  'p-button-secondary p-button=outlined',
          rejectLabel:  this.$t('common.cancel'),
          acceptLabel:  this.$t('common.delete'),
          acceptClass:  'p-button-danger',
          accept:       () => this.$emit('delete-selected-items-requested', this.selectedItems),
          reject:       () => {}
    });
    },
    exportToCsv() {
      this.$refs.dt.exportCSV();
    },
    editItem(item) {
      this.$emit('edit-item-requested', item);
    },
    confirmDeleteItem(item) {
      this.$confirm.require({
        message:      this.$t('shared.dataMeet.confirmDeleteItem', { item: this.title.singular }),
          header:       this.$t('shared.dataMeet.confirmation'),
          icon:         'pi pi-exclamation-triangle',
          rejectClass:  'p-button-secondary p-button=outlined',
          rejectLabel:  this.$t('common.cancel'),
          acceptLabel:  this.$t('common.delete'),
          acceptClass:  'p-button-danger',
          accept:       () => this.$emit('delete-item-requested', item),
          reject:       () => {}
    })
    }
  },
  created() {
    this.initFilters();
  }
}
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
  <h3>{{ $t('shared.dataMeet.management', { items: title.plural }) }}</h3>

  <!-- Toolbar section -->
  <pv-toolbar class="mb-4">
    <template #start>
      <pv-button class="mr-2" icon="pi pi-plus" :label="$t('shared.dataMeet.new')" severity="success" @click="newItem"/>
      <pv-button :disabled="!selectedItems || !selectedItems.length" icon="pi pi-trash" :label="$t('common.delete')" severity="danger"
                 @click="confirmDeleteSelected"/>
    </template>
    <template #end>
      <pv-button icon="pi pi-download" :label="$t('shared.dataMeet.export')" severity="help" @click="exportToCsv($event)"/>
    </template>
  </pv-toolbar>

  <pv-data-table
      ref="dt"
      v-model:selection="selectedItems"
      :filters="filters"
      :paginator="true"
      :rows="10"
      :rows-per-page-options="[5, 10, 15]"
      :value="items"
      :current-page-report-template="$t('shared.dataMeet.pageReport', { items: title.plural })"
      data-key="id"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown">
    <pv-column :exportable="false" selection-mode="multiple" style="width: 3em"/>
    <slot name="custom-columns"></slot>
    <template v-if="dynamic">
      <pv-column v-for="column in columns"
                 :key="column.field"
                 :field="column.field" :header="column.header"/>
    </template>
    <pv-column :exportable="false" style="min-width:8rem">
      <template #body="slotProps">
        <pv-button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editItem(slotProps.data)"/>
        <pv-button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteItem(slotProps.data)"/>
      </template>
    </pv-column>
  </pv-data-table>
</template>

<style scoped>

</style>