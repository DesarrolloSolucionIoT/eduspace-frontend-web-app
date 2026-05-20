<template>
  <pv-card :class="['meeting-card', { compact: compact }]">
    <template #title>
      <div class="card-title">
        <i class="pi pi-calendar"></i>
        <span>{{ meeting.title || $t('meetingManagement.common.untitledMeeting') }}</span>
      </div>
    </template>
    <template #content>
      <div class="meeting-content">
        <div v-if="compact" class="compact-content">
          <div class="compact-row">
            <i class="pi pi-calendar-plus"></i>
            <div class="compact-info">
              <div class="compact-label">{{ meeting.date || $t('meetingManagement.common.notAvailable') }}</div>
              <div class="compact-sub">
                {{ meeting.start || "—" }} - {{ meeting.end || "—" }}
              </div>
            </div>
            <div class="compact-right">
              <div class="compact-room">{{ classroomName }}</div>
              <div class="compact-teachers">
                {{
                  meeting.teachers && meeting.teachers.length
                    ? $t('meetingManagement.common.teachersCount', { count: meeting.teachers.length })
                    : $t('meetingManagement.common.noTeachers')
                }}
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <div class="row">
            <i class="pi pi-building"></i>
            <div>
              <div class="label">{{ $t('meetingManagement.common.classroom') }}</div>
              <div class="value">{{ classroomName }}</div>
            </div>
          </div>
          <div class="row">
            <i class="pi pi-calendar-plus"></i>
            <div>
              <div class="label">{{ $t('common.date') }}</div>
              <div class="value">{{ meeting.date || $t('meetingManagement.common.notAvailable') }}</div>
            </div>
          </div>
          <div class="row time-row">
            <i class="pi pi-clock"></i>
            <div>
              <div class="label">{{ $t('meetingManagement.common.time') }}</div>
              <div class="value">
                {{ meeting.start || meeting.startTime || $t('meetingManagement.common.notAvailable') }} -
                {{ meeting.end || meeting.endTime || $t('meetingManagement.common.notAvailable') }}
              </div>
            </div>
          </div>

          <div class="row">
            <i class="pi pi-users"></i>
            <div>
              <div class="label">{{ $t('meetingManagement.common.teachers') }}</div>
              <div class="value">
                <span v-if="meeting.teachers && meeting.teachers.length">
                  {{
                    meeting.teachers
                      .map((t) =>
                        t.firstName
                          ? t.firstName + (t.lastName ? " " + t.lastName : "")
                          : t.name || t
                      )
                      .join(", ")
                  }}
                </span>
                <span v-else>{{ $t('meetingManagement.common.noTeachers') }}</span>
              </div>
            </div>
          </div>

          <div class="description" v-if="meeting.description">
            <div class="label">{{ $t('common.description') }}</div>
            <div class="value">{{ meeting.description }}</div>
          </div>
        </div>
      </div>
    </template>
    <template #footer v-if="!compact">
      <div class="card-actions">
        <pv-button
          icon="pi pi-pencil"
          :label="$t('common.edit')"
          severity="warning"
          size="small"
          @click="$emit('edit', meeting)"
        />
        <pv-button
          icon="pi pi-trash"
          :label="$t('common.delete')"
          severity="danger"
          size="small"
          @click="$emit('delete', meeting)"
        />
      </div>
    </template>
  </pv-card>
</template>

<script>
export default {
  name: "MeetingCard",
  props: {
    meeting: {
      type: Object,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    classroomName() {
      const c = this.meeting.classroom;
      const fallback = this.$t("meetingManagement.common.notAvailable");
      if (!c) return fallback;
      if (typeof c === "string") return c;
      return c.name || c.room || fallback;
    },
  },
};
</script>

<style scoped>
.meeting-card {
  border-radius: 8px;
  padding: 0;
  border: 1px solid rgba(44, 62, 80, 0.12);
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.1);
  background: #ffffff;
  transition: box-shadow 0.18s ease, transform 0.12s ease;
}
.meeting-card:hover {
  box-shadow: 0 12px 36px rgba(44, 62, 80, 0.18);
  transform: translateY(-3px);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}
.card-title i {
  color: #3b82f6;
}
.meeting-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.row i {
  color: #6c757d;
  min-width: 22px;
}
.label {
  font-size: 0.75rem;
  color: #6c757d;
}
.value {
  font-size: 0.95rem;
  color: #2c3e50;
}
.description {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
}
.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.compact-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 4px;
}
.compact-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.compact-info {
  display: flex;
  flex-direction: column;
}
.compact-label {
  font-weight: 600;
}
.compact-sub {
  font-size: 0.85rem;
  color: #6c757d;
}
.compact-right {
  text-align: right;
  margin-left: auto;
}
.compact-room {
  font-size: 0.9rem;
  color: #2c3e50;
}
.compact-teachers {
  font-size: 0.8rem;
  color: #6c757d;
}
</style>
