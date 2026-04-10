<script>
import {mapGetters} from "vuex";
import {ReservationService} from "../../reservation-management/services/reservation.service.js";
import {SharedAreaService} from "../../classroom-space-resource-management/services/shared-area.service.js";
import {toDateOnlyString, toTimeOnlyString} from "../../shared/utils/date-utils.js";

export default {
  name: "TeacherSpaceAvailability",
  data() {
    return {
      myReservations: [],
      sharedAreas: [],
      loading: true,
      reservationService: new ReservationService(),
      sharedAreaService: new SharedAreaService(),

      showEditDialog: false,
      isSubmitting: false,
      editForm: {
        id: null,
        title: '',
        areaId: null,
        date: null,
        start: null,
        end: null
      },

      activeTab: 'active'
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),

    activeReservations() {
      const now = new Date();
      return this.myReservations.filter(r => new Date(r.end) >= now);
    },

    pastReservations() {
      const now = new Date();
      return this.myReservations.filter(r => new Date(r.end) < now);
    },

    displayedReservations() {
      return this.activeTab === 'active' ? this.activeReservations : this.pastReservations;
    },

    isEditValid() {
      if (!this.editForm.start || !this.editForm.end) return false;
      const start = new Date(this.editForm.start);
      const end = new Date(this.editForm.end);
      const diffHours = (end - start) / (1000 * 60 * 60);

      return this.editForm.title &&
             this.editForm.date &&
             diffHours > 0 &&
             diffHours <= 2;
    }
  },
  methods: {
    async loadMyReservations() {
      try {
        this.loading = true;
        const reservationsResponse = await this.reservationService.getAll();
        this.myReservations = reservationsResponse.data.filter(
            (reservation) => reservation.teacherId === this.userId
        );
        const areasResponse = await this.sharedAreaService.getAll();
        this.sharedAreas = areasResponse.data;
      } catch (error) {
        console.error("Error al cargar reservas:", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load reservations', life: 3000 });
      } finally {
        this.loading = false;
      }
    },

    getAreaName(areaId) {
      const area = this.sharedAreas.find((a) => a.id === areaId);
      return area ? area.name : "Unknown Area";
    },

    formatDateTime(dateString) {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        return date.toLocaleString("es-ES", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return dateString;
      }
    },

    confirmDelete(event, reservation) {
      this.$confirm.require({
        target: event.currentTarget,
        message: 'Are you sure you want to cancel this reservation?',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => this.deleteReservation(reservation),
        reject: () => {}
      });
    },

    async deleteReservation(reservation) {
      try {
        await this.reservationService.delete(reservation.id);
        this.myReservations = this.myReservations.filter(r => r.id !== reservation.id);
        this.$toast.add({ severity: 'success', summary: 'Deleted', detail: 'Reservation cancelled', life: 3000 });
      } catch (error) {
        console.error(error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not cancel reservation', life: 3000 });
      }
    },

    isReservationExpired(reservation) {
      return new Date(reservation.end) < new Date();
    },

    openEditDialog(reservation) {
      if (this.isReservationExpired(reservation)) {
        this.$toast.add({
          severity: 'warn',
          summary: 'Cannot Edit',
          detail: 'Cannot edit expired reservations',
          life: 3000
        });
        return;
      }

      const startObj = new Date(reservation.start);
      const endObj = new Date(reservation.end);

      this.editForm = {
        id: reservation.id,
        title: reservation.title,
        areaId: reservation.areaId,
        date: startObj,
        start: startObj,
        end: endObj
      };
      this.showEditDialog = true;
    },

    async saveEdit() {
      if (!this.isEditValid) return;
      this.isSubmitting = true;

      try {
        const dateStr = toDateOnlyString(this.editForm.date);
        const startTime = toTimeOnlyString(this.editForm.start);
        const endTime = toTimeOnlyString(this.editForm.end);

        const payload = {
          title: this.editForm.title,
          start: `${dateStr}T${startTime}`,
          end: `${dateStr}T${endTime}`
        };

        await this.reservationService.update(this.editForm.id, payload);

        const index = this.myReservations.findIndex(r => r.id === this.editForm.id);
        if (index !== -1) {
          this.myReservations[index] = {
            ...this.myReservations[index],
            title: payload.title,
            start: payload.start,
            end: payload.end
          };
        }

        this.$toast.add({ severity: 'success', summary: 'Updated', detail: 'Reservation updated successfully', life: 3000 });
        this.showEditDialog = false;

      } catch (error) {
        console.error(error);
        const msg = error.response?.data?.message || 'Failed to update. Time might be occupied.';
        this.$toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
      } finally {
        this.isSubmitting = false;
      }
    },

    goBack() {
      this.$router.back();
    },
  },
  mounted() {
    this.loadMyReservations();
  },
};
</script>

<template>
  <div class="space-availability-container">
    <pv-confirm-popup />

    <div class="breadcrumb">
      <pv-button icon="pi pi-arrow-left" text @click="goBack" class="back-button" />
      <h4>Reservations</h4>
      <i class="pi pi-chevron-right"></i>
      <h4>My Reservations</h4>
    </div>

    <div v-if="loading" class="loading-container">
      <pv-progress-spinner strokeWidth="4" />
      <span class="ml-3">Loading your reservations...</span>
    </div>

    <div v-else-if="myReservations.length === 0" class="empty-state">
      <i class="pi pi-calendar empty-icon"></i>
      <h3>No reservations found</h3>
      <p>You don't have any shared space reservations yet.</p>
      <pv-button
          label="Make a Reservation"
          icon="pi pi-plus"
          @click="$router.push({ name: 'reservation-management' })"
          class="mt-3 p-button-outlined"
      />
    </div>

    <div v-else>
      <div class="tabs-container">
        <button
            :class="['tab-button', { active: activeTab === 'active' }]"
            @click="activeTab = 'active'"
        >
          <i class="pi pi-calendar-plus"></i>
          Active Reservations
          <span class="badge">{{ activeReservations.length }}</span>
        </button>
        <button
            :class="['tab-button', { active: activeTab === 'history' }]"
            @click="activeTab = 'history'"
        >
          <i class="pi pi-history"></i>
          History
          <span class="badge">{{ pastReservations.length }}</span>
        </button>
      </div>

      <div v-if="displayedReservations.length === 0" class="empty-tab-state">
        <i :class="['pi', activeTab === 'active' ? 'pi-calendar-plus' : 'pi-history', 'empty-icon']"></i>
        <h3>{{ activeTab === 'active' ? 'No active reservations' : 'No past reservations' }}</h3>
        <p>{{
            activeTab === 'active' ? 'You don\'t have any upcoming reservations.' : 'No reservation history yet.'
          }}</p>
      </div>

      <div v-else class="reservations-grid">
        <div
            v-for="reservation in displayedReservations"
            :key="reservation.id"
            :class="['reservation-card', { expired: isReservationExpired(reservation) }]"
        >
        <div class="card-header">
          <div class="header-left">
            <i :class="['pi', isReservationExpired(reservation) ? 'pi-clock' : 'pi-calendar-check']"></i>
            <span class="area-badge">{{ getAreaName(reservation.areaId) }}</span>
            <span v-if="isReservationExpired(reservation)" class="expired-badge">Expired</span>
          </div>
          <div class="header-actions">
            <pv-button
                v-if="!isReservationExpired(reservation)"
              icon="pi pi-pencil"
              text
              rounded
              severity="info"
              class="action-btn"
              @click="openEditDialog(reservation)"
              v-tooltip="'Edit'"
            />
            <pv-button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              class="action-btn"
              @click="confirmDelete($event, reservation)"
              v-tooltip="'Cancel'"
            />
          </div>
        </div>

        <div class="card-content">
          <h3 class="reservation-title">{{ reservation.title }}</h3>

          <div class="time-info">
            <div class="time-row">
              <span class="label">Start:</span>
              <span class="value">{{ formatDateTime(reservation.start) }}</span>
            </div>
            <div class="time-row">
              <span class="label">End:</span>
              <span class="value">{{ formatDateTime(reservation.end) }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <pv-dialog
      v-model:visible="showEditDialog"
      modal
      header="Edit Reservation"
      :style="{ width: '400px' }"
      class="edit-dialog"
    >
      <div class="form-content">
        <div class="field">
          <label>Activity Title</label>
          <pv-input-text v-model="editForm.title" class="w-full" />
        </div>

        <div class="field">
          <label>Date</label>
          <pv-date-picker
            v-model="editForm.date"
            dateFormat="yy-mm-dd"
            :minDate="new Date()"
            showIcon
            class="w-full"
          />
        </div>

        <div class="form-row">
          <div class="field half">
            <label>Start</label>
            <pv-date-picker v-model="editForm.start" timeOnly hourFormat="24" :stepMinute="15" class="w-full" />
          </div>
          <div class="field half">
            <label>End</label>
            <pv-date-picker v-model="editForm.end" timeOnly hourFormat="24" :stepMinute="15" class="w-full" />
          </div>
        </div>
      </div>

      <template #footer>
        <pv-button label="Cancel" text severity="secondary" @click="showEditDialog = false" />
        <pv-button label="Save Changes" icon="pi pi-check" @click="saveEdit" :loading="isSubmitting" :disabled="!isEditValid" />
      </template>
    </pv-dialog>

  </div>
</template>

<style scoped>
.space-availability-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Poppins', sans-serif;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 2.5rem;
  color: #64748b;
}

.breadcrumb h4 {
  margin: 0;
  font-weight: 500;
  font-size: 1rem;
}

.breadcrumb i {
  font-size: 0.8rem;
}

.back-button {
  color: #334155;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.tabs-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #f1f5f9;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #64748b;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #334155;
  background: #f8fafc;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button .badge {
  background: #e2e8f0;
  color: #475569;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 1.5rem;
  text-align: center;
}

.tab-button.active .badge {
  background: #dbeafe;
  color: #3b82f6;
}

.empty-tab-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
  margin-top: 1rem;
}

.empty-tab-state .empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-tab-state h3 {
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.empty-tab-state p {
  color: #94a3b8;
  margin: 0;
}

.reservations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.reservation-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.reservation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.reservation-card.expired {
  opacity: 0.7;
  border-color: #e2e8f0;
}

.reservation-card.expired .card-header {
  background: #f8fafc;
}

.card-header {
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-left i {
  color: #64748b;
}

.area-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  background: #e2e8f0;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.expired-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  margin-left: 0.25rem;
}

.header-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 2rem;
  height: 2rem;
}

.card-content {
  padding: 1.25rem;
}

.reservation-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.time-row {
  display: flex;
  justify-content: space-between;
  color: #475569;
}

.time-row .label {
  color: #94a3b8;
  font-weight: 500;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.25rem;
  display: block;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.half {
  flex: 1;
}

:deep(.p-inputtext),
:deep(.p-datepicker) {
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #334155;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #94a3b8;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .reservations-grid {
    grid-template-columns: 1fr;
  }

  .space-availability-container {
    padding: 1rem;
  }
}
</style>