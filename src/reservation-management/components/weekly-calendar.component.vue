<script>
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default {
  name: "weekly-calendar",
  props: {
    events: { type: Array, required: true },
    areaId: { type: Number, required: true },
    userId: { type: Number, required: true }
  },
  computed: {
    calendarOptions() {
      return {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek'
        },
        events: this.events,
        initialView: 'timeGridWeek',
        editable: false,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        eventsSet: this.handleEvents,
        height: 'auto',
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        selectConstraint: {
          start: new Date()
        },
        validRange: {
          start: new Date()
        },
        businessHours: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '07:00',
          endTime: '20:00'
        },
        locale: 'es',
        buttonText: {
          today: 'Hoy',
          week: 'Semana'
        },
        slotLabelFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        },
        eventTimeFormat: {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }
      }
    }
  },
  data() {
    return {
      currentEvents: []
    }
  },
  methods: {
    handleDateSelect(selectInfo) {
      this.$emit('date-selected', {
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
      selectInfo.view.calendar.unselect();
    },

    handleEventClick(clickInfo) {
      const event = clickInfo.event;
      this.$toast.add({
        severity: 'info',
        summary: 'Detalles de Reserva',
        detail: `${event.title} (${event.start.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })} - ${event.end.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})`,
        life: 5000
      });
    },

    handleEvents(events) {
      this.currentEvents = events;
    }
  }
}
</script>

<template>
  <div class='calendar-container'>
    <div class='calendar-wrapper'>
      <fc-calendar
          class='enhanced-calendar'
          :options='calendarOptions'
      >
        <template v-slot:eventContent='arg'>
          <div class="event-content">
            <div class="event-time">
              <i class="pi pi-clock"></i>
              {{ arg.timeText }}
            </div>
            <div class="event-title">{{ arg.event.title }}</div>
          </div>
        </template>
      </fc-calendar>
    </div>
  </div>
</template>

<style scoped>
.calendar-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.calendar-wrapper {
  padding: 1.5rem;
}

.enhanced-calendar {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Header styling */
.enhanced-calendar :deep(.fc-toolbar) {
  padding: 1rem;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.enhanced-calendar :deep(.fc-toolbar-title) {
  color: #00838f;
  font-size: 1.5rem;
  font-weight: 600;
}

.enhanced-calendar :deep(.fc-button) {
  background: white;
  border: 1px solid #00bcd4;
  color: #00838f;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.enhanced-calendar :deep(.fc-button:hover) {
  background: #00bcd4;
  border-color: #00bcd4;
  color: white;
  transform: translateY(-1px);
}

.enhanced-calendar :deep(.fc-button-active) {
  background: #00acc1 !important;
  border-color: #00acc1 !important;
  color: white !important;
}

/* Column headers */
.enhanced-calendar :deep(.fc-col-header-cell) {
  background: #f8f9fa;
  border-color: #e9ecef;
  padding: 1rem 0.5rem;
  font-weight: 600;
  color: #495057;
}

.enhanced-calendar :deep(.fc-col-header-cell-cushion) {
  color: #495057;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

/* Time slots */
.enhanced-calendar :deep(.fc-timegrid-slot) {
  height: 3rem;
  border-color: #e9ecef;
}

.enhanced-calendar :deep(.fc-timegrid-slot-label) {
  color: #6c757d;
  font-size: 0.875rem;
}

/* Events */
.enhanced-calendar :deep(.fc-event) {
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  box-shadow: 0 2px 4px rgba(0, 188, 212, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
}

.enhanced-calendar :deep(.fc-event:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 188, 212, 0.5);
}

.event-content {
  padding: 0.5rem;
  color: white;
}

.event-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  opacity: 0.95;
}

.event-time i {
  font-size: 0.7rem;
}

.event-title {
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Selection highlight */
.enhanced-calendar :deep(.fc-highlight) {
  background: rgba(0, 188, 212, 0.15);
  border-radius: 4px;
}

/* Today column */
.enhanced-calendar :deep(.fc-day-today) {
  background: rgba(0, 188, 212, 0.05) !important;
}

/* Business hours */
.enhanced-calendar :deep(.fc-non-business) {
  background: #f8f9fa;
}

/* Scrollbar */
.enhanced-calendar :deep(.fc-scroller)::-webkit-scrollbar {
  width: 8px;
}

.enhanced-calendar :deep(.fc-scroller)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.enhanced-calendar :deep(.fc-scroller)::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.enhanced-calendar :deep(.fc-scroller)::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-wrapper {
    padding: 1rem;
  }

  .enhanced-calendar :deep(.fc-toolbar) {
    flex-direction: column;
    gap: 1rem;
  }

  .enhanced-calendar :deep(.fc-toolbar-title) {
    font-size: 1.25rem;
  }
}
</style>