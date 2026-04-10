<template>
  <div class="dashboard-layout">
    <div class="teacher-info">
      <div class="teacher-avatar">
        <pv-avatar
          :label="initials || 'NA'"
          size="xlarge"
          style="background-color: #42a5f5; color: white; font-size: 30px"
        ></pv-avatar>
      </div>
      <div class="teacher-details">
        <p><strong>Name:</strong> {{ teacher?.firstName || "Not available" }}</p>
        <p>
          <strong>Last Name:</strong> {{ teacher?.lastName || "Not available" }}
        </p>
        <p>
          <strong>Cell Phone:</strong> {{ teacher?.phone || "Not available" }}
        </p>
        <p><strong>Status:</strong> Teacher</p>
        <p><strong>Email:</strong> {{ teacher?.email || "Not available" }}</p>
        <p><strong>DNI:</strong> {{ teacher?.dni || "Not available" }}</p>
      </div>
    </div>

    <pv-card class="classrooms-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-building header-icon"></i>
          <h3 class="card-title">Classroom Assignments</h3>
        </div>
      </template>
      <template #content>
        <div v-if="classroomReservations.length" class="classroom-list">
          <div
            v-for="(reservation, index) in classroomReservations"
            :key="index"
            class="classroom-item"
          >
            <div class="classroom-header">
              <i class="pi pi-home classroom-icon"></i>
              <h4 class="classroom-name">{{ reservation.name || "Unknown" }}</h4>
            </div>
            <p class="classroom-description">
              {{ reservation.description || "No description available" }}
            </p>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-building empty-icon"></i>
          <p>No classroom assignments yet.</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="reservations-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-calendar-plus header-icon"></i>
          <h3 class="card-title">Shared Area Reservations</h3>
        </div>
      </template>
      <template #content>
        <div v-if="sharedAreaReservations.length">
          <div class="reservation-grid">
            <div
              v-for="(reservation, index) in sharedAreaReservations"
              :key="`shared-${reservation.id || index}`"
              class="reservation-card"
            >
              <div class="reservation-header">
                <h4 class="reservation-title">
                  {{ reservation.title || "No title" }}
                </h4>
                <span class="reservation-badge">{{
                  reservation.areaName || "Unknown area"
                }}</span>
              </div>
              <div class="reservation-info">
                <p class="reservation-time">
                  <i class="pi pi-clock"></i>
                  <strong>Start:</strong> {{ formatDateTime(reservation.start) }}
                </p>
                <p class="reservation-time">
                  <i class="pi pi-clock"></i>
                  <strong>End:</strong> {{ formatDateTime(reservation.end) }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-calendar-plus empty-icon"></i>
          <p>No shared area reservations yet.</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="meetings-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-users header-icon"></i>
          <h3 class="card-title">My Meetings</h3>
        </div>
      </template>
      <template #content>
        <div v-if="meetings.length">
          <div class="meeting-list">
            <div
              v-for="(meeting, index) in meetings"
              :key="index"
              class="meeting-item"
            >
              <div class="meeting-header">
                <h4 class="meeting-title">
                  {{ meeting.title || "No title" }}
                </h4>
                <span class="meeting-badge">{{
                  meeting.classroom || "Unknown"
                }}</span>
              </div>
              <p class="meeting-description">
                {{ meeting.description || "No description" }}
              </p>
              <div class="meeting-footer">
                <span class="meeting-date">
                  <i class="pi pi-calendar"></i>
                  {{ formatDate(meeting.day) }}
                </span>
                <span class="meeting-time">
                  <i class="pi pi-clock"></i>
                  {{ meeting.start || "N/A" }} - {{ meeting.end || "N/A" }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-users empty-icon"></i>
          <p>No meetings scheduled.</p>
        </div>
      </template>
    </pv-card>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import http from "../../shared/services/http-common.js";
import {ReservationService} from "../../reservation-management/services/reservation.service.js";
import {MeetService} from "../../meeting-management/services/meet.service.js";
import {ClassroomService} from "../../shared/services/classroom.service.js";

export default {
  name: "TeacherDashboard",
  data() {
    return {
      teacher: null,
      classroomReservations: [],
      sharedAreaReservations: [],
      meetings: [],
      reservationService: new ReservationService(),
      meetService: new MeetService(),
      classroomService: new ClassroomService(),
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),
    fullName() {
      return `${this.teacher?.firstName || ""} ${this.teacher?.lastName || ""}`.trim();
    },
    initials() {
      const [firstName, lastName] = [
        this.teacher?.firstName || "",
        this.teacher?.lastName || "",
      ];
      return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
    },
  },
  methods: {
    formatDateTime(dateString) {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error("Error formatting date:", error);
        return dateString;
      }
    },
    formatDate(dateString) {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },
  },
  async mounted() {
    if (!this.userId) {
      console.error("Teacher ID not found.");
      return;
    }
    try {
      const teacherResponse = await http.get(`/teachers-profiles/${this.userId}`);
      this.teacher = teacherResponse.data;

      const classroomResponse = await http.get(`/classrooms/teachers/${this.userId}`);
      this.classroomReservations = classroomResponse.data;

      const allClassroomsResponse = await this.classroomService.getAll();
      const allClassrooms = allClassroomsResponse.data;

      const [areasResponse, reservationsResponse] = await Promise.all([
        http.get("/shared-area"),
        this.reservationService.getAll()
      ]);
      const allAreas = areasResponse.data;
      const allReservations = reservationsResponse.data;

      const myReservations = allReservations.filter(
          (reservation) => reservation.teacherId === this.userId
      );

      this.sharedAreaReservations = myReservations.map(reservation => {
        const area = allAreas.find(a => a.id === reservation.areaId);
        return {
          ...reservation,
          areaName: area ? area.name : 'Unknown area'
        };
      });

      const meetResponse = await http.get(`/teachers/${this.userId}/meetings`);

      this.meetings = meetResponse.data.map(meet => {
        const classroomId = meet.classroomId?.classroomIdentifier || meet.classroomId;
        const classroomObj = allClassrooms.find(c => c.id === classroomId);

        return {
          ...meet,
          classroom: classroomObj ? classroomObj.name : "Unknown Classroom",
          day: meet.date
        };
      });

    } catch (error) {
      console.error("Error loading teacher dashboard data:", error);
    }
  },
};
</script>

<style scoped>
.dashboard-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

.teacher-info {
  grid-column: span 3;
  background: linear-gradient(
    135deg,
    rgba(66, 165, 245, 0.4) 0%,
    rgba(100, 181, 246, 0.3) 100%
  );
  padding: 25px;
  border-radius: 20px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.teacher-avatar {
  grid-column: 1 / 2;
}

.teacher-details {
  grid-column: 2 / 3;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.teacher-details p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.scrollable-card {
  height: 450px;
  overflow-y: auto;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.scrollable-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.classrooms-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.reservations-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.meetings-card {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.card-header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
}

.header-icon {
  font-size: 24px;
  color: #2196f3;
}

.classrooms-card .header-icon {
  color: #1976d2;
}

.reservations-card .header-icon {
  color: #388e3c;
}

.meetings-card .header-icon {
  color: #f57c00;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.classroom-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.classroom-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.classroom-item:hover {
  transform: translateX(4px);
}

.classroom-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.classroom-icon {
  color: #1976d2;
  font-size: 18px;
}

.classroom-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.classroom-description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.reservation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px;
}

.reservation-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reservation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.reservation-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.reservation-badge {
  background: rgba(56, 142, 60, 0.15);
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

.reservation-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reservation-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
  margin: 0;
}

.reservation-time i {
  color: #388e3c;
  font-size: 14px;
}

.meeting-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meeting-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.meeting-item:hover {
  transform: translateX(4px);
}

.meeting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.meeting-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.meeting-badge {
  background: rgba(245, 124, 0, 0.15);
  color: #e65100;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

.meeting-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.meeting-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.meeting-date,
.meeting-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
}

.meeting-date i,
.meeting-time i {
  color: #f57c00;
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  color: #bbb;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

.scrollable-card::-webkit-scrollbar {
  width: 8px;
}

.scrollable-card::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.scrollable-card::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.scrollable-card::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>