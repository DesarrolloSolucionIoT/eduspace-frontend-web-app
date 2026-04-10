<script>
export default {
  name: "reservation-toolbar",
  props: {
    sharedAreas: {type: Array, required: true}
  },
  data() {
    return {
      selectedItem: null
    }
  },
  methods: {
    onSharedSpaceSelected(item) {
      if(item) {
        this.$emit('shared-space-selected', item);
      }
    }
  }
}
</script>

<template>
  <div class="toolbar-container">
    <div class="toolbar-content">
      <div class="toolbar-header">
        <div class="header-icon">
          <i class="pi pi-building"></i>
        </div>
        <div class="header-text">
          <h2 class="header-title">Gestión de Reservas</h2>
          <p class="header-subtitle">Selecciona un espacio para ver las reservas disponibles</p>
        </div>
      </div>

      <div class="search-section">
        <div class="select-wrapper">
          <i class="pi pi-map-marker select-icon"></i>
          <pv-select
              v-model="selectedItem"
              :options="sharedAreas"
              optionLabel="name"
              placeholder="Selecciona un espacio compartido"
              checkmark
              :highlightOnSelect="false"
              class="space-select"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="selected-value">
                <i class="pi pi-map-marker"></i>
                <span>{{ slotProps.value.name }}</span>
              </div>
              <span v-else class="placeholder-text">
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="slotProps">
              <div class="option-item">
                <i class="pi pi-building"></i>
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </pv-select>
        </div>

        <pv-button
            label="Buscar Reservas"
            icon="pi pi-search"
            @click="onSharedSpaceSelected(selectedItem)"
            :disabled="!selectedItem"
            class="search-button"
            iconPos="left"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-container {
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 188, 212, 0.2);
}

.toolbar-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header Section */
.toolbar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #00838f;
}

.header-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 188, 212, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: #00bcd4;
}

.header-text {
  flex: 1;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #00838f;
}

.header-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #00acc1;
  font-weight: 400;
}

/* Search Section */
.search-section {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.select-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.select-icon {
  position: absolute;
  left: 1rem;
  color: #00bcd4;
  font-size: 1.1rem;
  z-index: 1;
  pointer-events: none;
}

.space-select {
  width: 100%;
  background: white;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.space-select :deep(.p-select-label) {
  padding: 0.875rem 1rem 0.875rem 3rem;
  font-weight: 500;
  color: #2d3748;
}

.space-select :deep(.p-select-dropdown) {
  color: #00bcd4;
}

.space-select:hover {
  box-shadow: 0 6px 16px rgba(0, 188, 212, 0.15);
  transform: translateY(-1px);
}

.space-select:focus-within {
  box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.2);
}

.selected-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2d3748;
}

.selected-value i {
  color: #00bcd4;
  font-size: 0.9rem;
}

.placeholder-text {
  color: #a0aec0;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

.option-item i {
  color: #00bcd4;
  font-size: 1rem;
}

/* Search Button */
.search-button {
  padding: 0.875rem 2rem;
  background: #00bcd4;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.search-button:hover:not(:disabled) {
  background: #00acc1;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 188, 212, 0.4);
}

.search-button:active:not(:disabled) {
  transform: translateY(0);
}

.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #b2ebf2;
}

.search-button :deep(.p-button-label) {
  font-weight: 600;
}

.search-button :deep(.p-button-icon) {
  font-size: 1.1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .toolbar-container {
    padding: 1.5rem;
    border-radius: 12px;
  }

  .toolbar-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-icon {
    width: 3rem;
    height: 3rem;
    font-size: 1.5rem;
  }

  .header-title {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.85rem;
  }

  .search-section {
    flex-direction: column;
  }

  .search-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .toolbar-container {
    padding: 1.25rem;
  }

  .header-title {
    font-size: 1.1rem;
  }

  .space-select :deep(.p-select-label) {
    font-size: 0.9rem;
  }

  .search-button {
    font-size: 0.9rem;
    padding: 0.75rem 1.5rem;
  }
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toolbar-container {
  animation: fadeInUp 0.5s ease-out;
}
</style>