<script>
export default {
  name: "create-reservation-dialog",
  props: {
    visible: { type: Boolean, required: true },
    dateInfo: { type: Object, default: null }
  },
  data() {
    return {
      title: '',
      isSubmitting: false
    }
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.resetForm();
      }
    }
  },
  methods: {
    resetForm() {
      this.title = '';
      this.isSubmitting = false;
    },

    onSubmit() {
      if (!this.title.trim()) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Campo requerido',
          detail: 'Por favor ingresa un título para la reserva',
          life: 3000
        });
        return;
      }

      this.isSubmitting = true;

      const reservation = {
        title: this.title.trim(),
        start: this.dateInfo.start,
        end: this.dateInfo.end
      };

      setTimeout(() => {
        this.$emit('reservation-created', reservation);
        this.resetForm();
      }, 500);
    },

    onCancel() {
      this.$emit('dialog-closed');
      this.resetForm();
    },

    getDuration() {
      if (!this.dateInfo) return '';
      const start = new Date(this.dateInfo.start);
      const end = new Date(this.dateInfo.end);
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);

      if (diffHrs > 0 && diffMins > 0) {
        return `${diffHrs}h ${diffMins}min`;
      } else if (diffHrs > 0) {
        return `${diffHrs}h`;
      } else {
        return `${diffMins}min`;
      }
    },

    formatDateTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
</script>

<template>
  <pv-dialog
      :visible="visible"
      :modal="true"
      :style="{ width: '32rem' }"
      @update:visible="onCancel"
      :draggable="false"
      class="reservation-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <i class="pi pi-calendar-plus"></i>
        </div>
        <div class="header-content">
          <h3 class="header-title">Nueva Reserva</h3>
          <p class="header-subtitle">Reservar Espacio Compartido</p>
        </div>
      </div>
    </template>

    <div class="dialog-body">
      <!-- Title Input -->
      <div class="form-group">
        <label for="title" class="form-label">
          <i class="pi pi-pencil"></i>
          Título de la Reserva
        </label>
        <pv-input-text
            id="title"
            v-model="title"
            placeholder="Ej: Reunión de equipo, Clase de matemáticas..."
            class="form-input"
            autofocus
            :class="{ 'p-invalid': !title.trim() && title !== '' }"
        />
        <small class="form-hint">Este título será visible en el calendario</small>
      </div>

      <!-- Date Info -->
      <div v-if="dateInfo" class="date-info-card">
        <div class="date-info-header">
          <i class="pi pi-clock"></i>
          <span>Horario Seleccionado</span>
        </div>

        <div class="date-info-content">
          <div class="date-info-row">
            <div class="date-info-item">
              <span class="date-label">Inicio</span>
              <span class="date-value">{{ formatDateTime(dateInfo.start) }}</span>
            </div>
            <div class="date-divider">
              <i class="pi pi-arrow-right"></i>
            </div>
            <div class="date-info-item">
              <span class="date-label">Fin</span>
              <span class="date-value">{{ formatDateTime(dateInfo.end) }}</span>
            </div>
          </div>

          <div class="duration-badge">
            <i class="pi pi-stopwatch"></i>
            Duración: {{ getDuration() }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <pv-button
            label="Cancelar"
            icon="pi pi-times"
            @click="onCancel"
            severity="secondary"
            outlined
            :disabled="isSubmitting"
            class="footer-button"
        />
        <pv-button
            label="Crear Reserva"
            icon="pi pi-check"
            @click="onSubmit"
            :disabled="!title.trim() || isSubmitting"
            :loading="isSubmitting"
            class="footer-button primary-button"
        />
      </div>
    </template>
  </pv-dialog>
</template>

<style scoped>
/* Dialog Header */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.header-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
}

.header-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #718096;
}

/* Dialog Body */
.dialog-body {
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Form Group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
}

.form-label i {
  color: #00bcd4;
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #00bcd4;
  box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.1);
}

.form-input.p-invalid {
  border-color: #f56565;
}

.form-hint {
  color: #a0aec0;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Date Info Card */
.date-info-card {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
}

.date-info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #2d3748;
}

.date-info-header i {
  color: #00bcd4;
  font-size: 1.1rem;
}

.date-info-content {
  padding: 1.25rem;
}

.date-info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.date-info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #718096;
}

.date-value {
  font-size: 0.9rem;
  color: #2d3748;
  font-weight: 500;
}

.date-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e0;
  font-size: 1rem;
}

.duration-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.duration-badge i {
  font-size: 0.9rem;
}

/* Dialog Footer */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

.footer-button {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.primary-button {
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  border: none;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  :deep(.reservation-dialog) {
    width: 95vw !important;
  }

  .date-info-row {
    flex-direction: column;
    gap: 1rem;
  }

  .date-divider {
    transform: rotate(90deg);
  }
}

/* Animation */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.p-dialog) {
  animation: slideInDown 0.3s ease-out;
}
</style>