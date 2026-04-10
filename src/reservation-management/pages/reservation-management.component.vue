<script>
import {ReservationService} from "../services/reservation.service.js";
import {SharedAreaService} from "../../classroom-space-resource-management/services/shared-area.service.js";
import {SharedSpace} from "../../classroom-space-resource-management/model/SharedSpace.entity.js";
import {toDateOnlyString, toTimeOnlyString} from "../../shared/utils/date-utils.js";
import {mapGetters} from "vuex";

export default {
  name: "reservation-management",
  data() {
    return {
      form: {
        title: '',
        area: null,
        date: null,
        start: null,
        end: null
      },
      areas: [],
      existingReservations: [],
      loading: false,
      isSubmitting: false,
      loadingAvailability: false,
      reservationService: new ReservationService(),
      sharedAreaService: new SharedAreaService(),
      timeSlots: this.generateTimeSlots()
    }
  },
  computed: {
    ...mapGetters('user', ['userId']),

    reservationDuration() {
      if (!this.form.start || !this.form.end) return 0;
      const start = new Date(this.form.start);
      const end = new Date(this.form.end);
      const diffMs = end - start;
      return diffMs / (1000 * 60 * 60);
    },

    isValidTimeRange() {
      if (!this.form.start || !this.form.end) return true;

      const start = new Date(this.form.start);
      const end = new Date(this.form.end);

      const startHour = start.getHours();
      const endHour = end.getHours();
      const endMinute = end.getMinutes();

      const isStartValid = startHour >= 7;
      const isEndValid = endHour < 20 || (endHour === 20 && endMinute === 0);

      return isStartValid && isEndValid;
    },

    isDateTimePast() {
      if (!this.form.date || !this.form.start) return false;

      const selectedDate = new Date(this.form.date);
      const selectedTime = new Date(this.form.start);

      const combined = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          selectedTime.getHours(),
          selectedTime.getMinutes()
      );

      return combined < new Date();
    },

    availableStartTimes() {
      if (!this.form.date) return [];

      const times = [];
      const now = new Date();
      const selectedDate = new Date(this.form.date);
      const isToday = selectedDate.toDateString() === now.toDateString();

      for (let hour = 7; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeDate = new Date(2000, 0, 1, hour, minute);

          if (isToday) {
            const testDateTime = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                hour,
                minute
            );
            if (testDateTime <= now) continue;
          }

          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          const displayTime = timeDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          times.push({
            label: displayTime,
            value: timeDate
          });
        }
      }

      return times;
    },

    availableEndTimes() {
      if (!this.form.start) return [];

      const times = [];
      const startTime = new Date(this.form.start);
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();

      const maxHour = Math.min(startHour + 2, 20);

      for (let hour = startHour; hour <= maxHour; hour++) {
        const startMin = (hour === startHour) ? startMinute + 30 : 0;
        const endMin = (hour === maxHour) ? 0 : 60;

        for (let minute = startMin; minute < endMin; minute += 30) {
          if (hour === 20 && minute > 0) continue;

          const duration = (hour - startHour) + ((minute - startMinute) / 60);
          if (duration > 2) continue;

          const timeDate = new Date(2000, 0, 1, hour, minute);
          const displayTime = timeDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          times.push({
            label: `${displayTime} (${duration.toFixed(1)}h)`,
            value: timeDate
          });
        }
      }

      return times;
    },

    isValid() {
      const validDuration = this.reservationDuration > 0 && this.reservationDuration <= 2;
      return this.form.title &&
             this.form.area &&
             this.form.date &&
             this.form.start &&
             this.form.end &&
          validDuration &&
          this.isValidTimeRange &&
          !this.isDateTimePast;
    }
  },
  methods: {
    generateTimeSlots() {
      const slots = [];
      for (let hour = 7; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          slots.push({
            time: timeStr,
            hour,
            minute,
            available: true
          });
        }
      }
      slots.push({time: '20:00', hour: 20, minute: 0, available: true});
      return slots;
    },

    async loadAreas() {
      this.loading = true;
      try {
        const response = await this.sharedAreaService.getAll();
        this.areas = response.data.map(a => new SharedSpace(a));
      } catch (error) {
        console.error("Error loading areas", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load shared spaces' });
      } finally {
        this.loading = false;
      }
    },

    async loadAvailability() {
      if (!this.form.area || !this.form.date) {
        this.existingReservations = [];
        return;
      }

      this.loadingAvailability = true;
      try {
        const response = await this.reservationService.findAllByAreaId(this.form.area.id);
        const dateStr = toDateOnlyString(this.form.date);

        this.existingReservations = response.data.filter(res => {
          const resDate = res.start.split('T')[0];
          return resDate === dateStr;
        });
      } catch (error) {
        console.error("Error loading availability", error);
        this.existingReservations = [];
      } finally {
        this.loadingAvailability = false;
      }
    },

    isTimeSlotOccupied(slot) {
      if (!this.form.date || !this.form.area) return false;

      const slotDate = new Date(this.form.date);
      slotDate.setHours(slot.hour, slot.minute, 0, 0);

      return this.existingReservations.some(res => {
        const start = new Date(res.start);
        const end = new Date(res.end);
        return slotDate >= start && slotDate < end;
      });
    },

    selectTimeSlot(slot) {
      if (this.isTimeSlotOccupied(slot)) return;

      const selectedTime = new Date(2000, 0, 1, slot.hour, slot.minute);

      if (!this.form.start) {
        this.form.start = selectedTime;
      } else if (!this.form.end) {
        if (slot.hour > this.form.start.getHours() ||
            (slot.hour === this.form.start.getHours() && slot.minute > this.form.start.getMinutes())) {
          this.form.end = selectedTime;
        } else {
          this.form.start = selectedTime;
          this.form.end = null;
        }
      } else {
        this.form.start = selectedTime;
        this.form.end = null;
      }
    },

    formatTime(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    },

    async onSubmit() {
      if (!this.isValid) return;

      this.isSubmitting = true;

      try {
        const dateStr = toDateOnlyString(this.form.date);
        const startTime = toTimeOnlyString(this.form.start);
        const endTime = toTimeOnlyString(this.form.end);

        const reservationData = {
          title: this.form.title,
          start: `${dateStr}T${startTime}`,
          end: `${dateStr}T${endTime}`
        };

        console.log('Sending reservation data:', reservationData);

        await this.reservationService.create(this.userId, this.form.area.id, reservationData);

        this.$toast.add({ severity: 'success', summary: 'Confirmed', detail: 'Reservation created successfully', life: 3000 });

        this.resetForm();

      } catch (error) {
        console.error('Reservation error:', error);
        console.error('Error response:', error.response?.data);
        const msg = error.response?.data?.message || 'Failed to create reservation. Time might be occupied.';
        this.$toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
      } finally {
        this.isSubmitting = false;
      }
    },

    resetForm() {
      this.form = {
        title: '',
        area: null,
        date: null,
        start: null,
        end: null
      };
    }
  },
  watch: {
    'form.area'() {
      this.loadAvailability();
    },
    'form.date'() {
      this.loadAvailability();
    }
  },
  created() {
    this.loadAreas();
  }
}
</script>

<template>
  <div class="page-container">
    <div class="form-card">

      <div class="card-header">
        <div class="icon-box">
          <i class="pi pi-calendar-plus"></i>
        </div>
        <div class="header-text">
          <h2>Book a Space</h2>
          <p>Fill in the details to reserve a shared area.</p>
        </div>
      </div>

      <div class="form-content">
        <div class="field">
          <label>Activity Title</label>
          <pv-input-text
            v-model="form.title"
            placeholder="Ex: Soccer Team Practice"
            class="w-full"
          />
        </div>

        <div class="field">
          <label>Select Area</label>
          <pv-select
            v-model="form.area"
            :options="areas"
            optionLabel="name"
            placeholder="Choose a space..."
            class="w-full"
            :loading="loading"
          />
        </div>

        <div class="field">
          <label>Date</label>
          <pv-date-picker
            v-model="form.date"
            dateFormat="yy-mm-dd"
            :minDate="new Date()"
            showIcon
            class="w-full"
            placeholder="Select date"
          />
        </div>

        <div class="info-message">
          <i class="pi pi-info-circle"></i>
          <span>Reservations are available from 7:00 AM to 8:00 PM (max 2 hours)</span>
        </div>

        <div class="form-row">
          <div class="field half">
            <label>Start Time</label>
            <pv-select
              v-model="form.start"
              :disabled="!form.area || !form.date"
              :options="availableStartTimes"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Select start time"
            />
          </div>
          <div class="field half">
            <label>End Time (max 2hrs)</label>
            <pv-select
              v-model="form.end"
              :disabled="!form.start"
              :options="availableEndTimes"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Select end time"
            />
          </div>
        </div>

        <div v-if="form.area && form.date && form.start" class="availability-section">
          <div class="availability-header">
            <h3>📅 Occupied Time Slots Today</h3>
            <p>These times are unavailable</p>
          </div>

          <div v-if="loadingAvailability" class="loading-slots">
            <pv-progress-spinner strokeWidth="4" style="width: 30px; height: 30px"/>
            <span>Loading availability...</span>
          </div>

          <div v-else-if="existingReservations.length === 0" class="empty-availability">
            <i class="pi pi-check-circle"></i>
            <p>All time slots are available!</p>
          </div>

          <div v-else class="occupied-list">
            <div v-for="(reservation, index) in existingReservations" :key="index" class="occupied-item">
              <i class="pi pi-clock"></i>
              <span>{{ formatTime(reservation.start) }} - {{ formatTime(reservation.end) }}</span>
              <span class="occupied-label">Occupied</span>
            </div>
          </div>
        </div>

        <small v-if="reservationDuration > 2" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          Reservation cannot exceed 2 hours
        </small>
        <small v-else-if="!isValidTimeRange && form.start && form.end" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          Reservations must be between 7:00 AM and 8:00 PM
        </small>
        <small v-else-if="isDateTimePast" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          Cannot reserve in the past. Please select a future time.
        </small>

        <div class="action-area">
          <pv-button
            label="Confirm Reservation"
            icon="pi pi-check"
            class="submit-btn"
            @click="onSubmit"
            :loading="isSubmitting"
            :disabled="!isValid"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 3rem;
  background-color: transparent;
}

.form-card {
  background: #ffffff;
  width: 100%;
  max-width: 800px;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.02);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 2rem;
}

.icon-box {
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00838f;
  font-size: 1.5rem;
}

.header-text h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
  font-weight: 700;
}

.header-text p {
  margin: 0.25rem 0 0 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #34495e;
  margin-left: 0.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.half {
  flex: 1;
}

:deep(.p-inputtext),
:deep(.p-select),
:deep(.p-datepicker) {
  border-radius: 12px;
  border-color: #e2e8f0;
  padding: 0.8rem 1rem;
}

:deep(.p-inputtext:hover),
:deep(.p-select:hover) {
  border-color: #0CC0DF;
}

:deep(.p-inputtext:focus) {
  box-shadow: 0 0 0 2px rgba(12, 192, 223, 0.2);
  border-color: #0CC0DF;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 8px;
  color: #1565c0;
  font-size: 0.85rem;
  margin: -0.5rem 0 0.5rem 0;
}

.info-message i {
  font-size: 1rem;
  flex-shrink: 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e74c3c;
  margin-top: -0.5rem;
  font-size: 0.85rem;
}

.error-message i {
  font-size: 0.9rem;
}

.availability-section {
  background: #fef3c7;
  border-radius: 12px;
  padding: 1.25rem;
  margin: 1rem 0;
  border: 2px solid #fbbf24;
}

.availability-header {
  margin-bottom: 1rem;
}

.availability-header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #92400e;
  font-weight: 600;
}

.availability-header p {
  margin: 0;
  font-size: 0.8rem;
  color: #b45309;
}

.loading-slots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  color: #b45309;
}

.empty-availability {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #d1fae5;
  border-radius: 8px;
  color: #065f46;
}

.empty-availability i {
  font-size: 1.5rem;
  color: #10b981;
}

.occupied-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.occupied-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #fed7aa;
}

.occupied-item i {
  color: #dc2626;
  font-size: 1rem;
}

.occupied-item span:first-of-type {
  flex: 1;
  font-weight: 500;
  color: #1f2937;
}

.occupied-label {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.action-area {
  margin-top: 1rem;
}

.submit-btn {
  width: 100%;
  background-color: #0CC0DF;
  border: none;
  border-radius: 12px;
  padding: 1rem;
  font-weight: 600;
  font-size: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #09a0bb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(12, 192, 223, 0.3);
}

.submit-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .form-card {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .form-row {
    flex-direction: column;
  }
}
</style>