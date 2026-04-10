<script>
import {mapGetters} from "vuex";
import TeacherCardComponent from "../../personal-data/components/teacher-card.component.vue";
import {TeacherService} from "../../personal-data/services/teacher.service.js";
import http from "../../shared/services/http-common.js";
import MeetingCard from "../../meeting-management/components/meeting-card.vue";
import MeetCreateAndEditDialog from "../../meeting-management/components/meet-create-and-edit.component.vue";
import {Meet} from "../../meeting-management/model/meet.entity.js";
import {MeetService} from "../../meeting-management/services/meet.service.js";
import {ClassroomService} from "../../shared/services/classroom.service.js";
import {AdministratorsService} from "../../meeting-management/services/administrators.service.js";

export default {
  name: "AdminDashboard",
  components: {
    TeacherCardComponent,
    MeetingCard,
    MeetCreateAndEditDialog,
  },
  data() {
    return {
      admin: null,
      meetings: [],
      teachers: [],
      reports: [],
      meet: new Meet({}),
      meetService: null,
      classroomsService: null,
      administratorsService: null,
      createAndEditDialogIsVisible: false,
      isEdit: false,
      submitted: false,
    };
  },
  computed: {
    ...mapGetters("user", ["userId", "userRole", "userToken"]),
    initials() {
      if (!this.admin) return "NA";
      const { firstName = "", lastName = "" } = this.admin;
      return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
    },
  },
  async mounted() {
    try {
      if (!this.userId) return;

      const adminResponse = await http.get("/administrator-profiles");
      this.admin = adminResponse.data.find(
        (a) => Number(a.id) === Number(this.userId)
      );
      if (!this.admin) {
        return;
      }

      this.meetService = new MeetService();
      this.classroomsService = new ClassroomService();
      this.administratorsService = new AdministratorsService();

      await this.loadMeetings();

      this.teachers = await TeacherService.fetchTeachers();

      const reportsResponse = await http.get("/reports");
      this.reports = reportsResponse.data || [];
    } catch (error) {
      console.error("Error loading admin dashboard", error);
    }
  },

  methods: {
    notifySuccessfulAction(message) {
      if (this.$toast)
        this.$toast.add({
          severity: "success",
          summary: "Success",
          detail: message,
          life: 3000,
        });
    },
    notifyErrorAction(message) {
      if (this.$toast)
        this.$toast.add({
          severity: "error",
          summary: "Error",
          detail: message,
          life: 3000,
        });
    },

    async loadMeetings() {
      try {
        const [meetingsResponse, classroomsResponse, administratorsResponse] =
          await Promise.all([
            this.meetService.getAll(),
            this.classroomsService.getAll(),
            this.administratorsService.getAllAdministrators(),
          ]);

        const meetingsData = meetingsResponse.data;
        const allClassrooms = classroomsResponse.data;
        const allAdministrators = administratorsResponse.data;

        const mapped = meetingsData.map((meetData) => {
          const classroom =
            allClassrooms.find(
              (c) => c.id === meetData.classroomId?.classroomIdentifier
            ) || meetData.classroomId;
          const administrator =
            allAdministrators.find(
              (a) => a.id === meetData.administratorId?.administratorIdentifier
            ) || meetData.administratorId;

          return new Meet({
            meetingId: meetData.meetingId,
            title: meetData.title,
            description: meetData.description,
            date: meetData.date,
            start: meetData.start,
            end: meetData.end,
            classroom: classroom,
            administrator: administrator,
            teachers: meetData.teachers || [],
          });
        });

        const adminId =
          this.admin?.id ?? this.admin?.administratorIdentifier ?? null;
        const adminFullName = `${this.admin?.firstName || ""} ${
          this.admin?.lastName || ""
        }`.trim();

        const matchesAdmin = (mAdmin) => {
          if (!mAdmin) return false;
          if (typeof mAdmin === "object") {
            const mid =
              mAdmin.id ??
              mAdmin.administratorIdentifier ??
              mAdmin.administratorId ??
              null;
            const mName = mAdmin.name
              ? mAdmin.name
              : `${mAdmin.firstName || ""} ${mAdmin.lastName || ""}`.trim();
            if (mid && adminId && String(mid) === String(adminId)) return true;
            return !!(mName && adminFullName && mName === adminFullName);
          }
          return (
            String(mAdmin) === String(adminId) ||
            String(mAdmin) === adminFullName
          );
        };

        this.meetings = mapped.filter((m) => matchesAdmin(m.administrator));

        if (
          (!this.meetings || this.meetings.length === 0) &&
          mapped &&
          mapped.length > 0
        ) {
          this.meetings = mapped;
        }
      } catch (error) {
        console.error("Error loading meetings in admin home", error);
        this.notifyErrorAction("Could not load meetings");
      }
    },
    onSaveRequested(payload) {
      this.submitted = true;
      if (this.isEdit) {
        this.updateMeet(payload);
      } else {
        this.createMeet(payload);
      }
    },
    async createMeet(payload) {
      try {
        const createResponse = await this.meetService.create(
          payload.administratorId,
          payload.classroomId,
          payload.meetData
        );
        const newMeeting = createResponse.data;

        if (payload.teacherIds && payload.teacherIds.length > 0) {
          const addTeachersPromises = payload.teacherIds.map((teacherId) =>
            this.meetService.addTeacherToMeeting(
              newMeeting.meetingId,
              teacherId
            )
          );
          await Promise.all(addTeachersPromises);
        }
        await this.loadMeetings();
        this.notifySuccessfulAction("Meet Created Successfully");
      } catch (error) {
        console.error("Error creating meet from admin home", error);
        this.notifyErrorAction("An error occurred while creating the meet.");
      } finally {
        this.createAndEditDialogIsVisible = false;
      }
    },
    async updateMeet(payload) {
      try {
        payload.meetData.administratorId = this.meet.administrator?.id;
        payload.meetData.classroomId = this.meet.classroom?.id;

        await this.meetService.update(this.meet.id, payload.meetData);
        await this.loadMeetings();
        this.notifySuccessfulAction("Meet Updated Successfully");
      } catch (error) {
        console.error("Error updating meet from admin home", error);
        this.notifyErrorAction("An error occurred while updating the meet.");
      } finally {
        this.createAndEditDialogIsVisible = false;
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
};
</script>

<template>
  <div class="dashboard-layout">
    <div class="admin-info">
      <div class="admin-avatar">
        <pv-avatar
          :label="initials || 'NA'"
          size="xlarge"
          style="background-color: #2196f3; color: white; font-size: 30px"
        ></pv-avatar>
      </div>
      <div class="admin-details">
        <p><strong>Name:</strong> {{ admin?.firstName || "Not available" }}</p>
        <p>
          <strong>Last Name:</strong> {{ admin?.lastName || "Not available" }}
        </p>
        <p>
          <strong>Cell Phone:</strong> {{ admin?.phone || "Not available" }}
        </p>
        <p><strong>Status:</strong> Admin</p>
        <p><strong>Email:</strong> {{ admin?.email || "Not available" }}</p>
      </div>
    </div>

    <pv-card class="teachers-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-users header-icon"></i>
          <h3 class="card-title">Teachers Created</h3>
        </div>
      </template>
      <template #content>
        <div v-if="teachers.length" class="teacher-list">
          <TeacherCardComponent
            v-for="teacher in teachers"
            :key="teacher.id"
            :teacher="teacher"
            :compact="true"
          />
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-users empty-icon"></i>
          <p>No teachers have been created yet.</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="meet-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-calendar header-icon"></i>
          <h3 class="card-title">Meetings in Charge</h3>
        </div>
      </template>
      <template #content>
        <div v-if="meetings.length">
          <div class="cards-grid">
            <MeetingCard
              v-for="meeting in meetings"
              :key="meeting.id"
              :meeting="meeting"
              :compact="true"
            />
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-calendar empty-icon"></i>
          <p>No meetings assigned to this administrator.</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="reports-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-file header-icon"></i>
          <h3 class="card-title">Reports</h3>
        </div>
      </template>
      <template #content>
        <div v-if="reports.length">
          <ul class="reports-list">
            <li
              v-for="(report, index) in reports"
              :key="index"
              class="report-item"
            >
              <div class="report-row">
                <span class="report-label">Type:</span>
                <span class="report-value">{{ report.kindOfReport }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Description:</span>
                <span class="report-value">{{ report.description }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Resource ID:</span>
                <span class="report-value">{{ report.resourceId }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Created At:</span>
                <span class="report-value">{{
                  formatDate(report.createdAt)
                }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Status:</span>
                <span
                  class="report-value"
                  :class="'status-' + report.status.toLowerCase()"
                >
                  {{ report.status }}
                </span>
              </div>
              <hr v-if="index < reports.length - 1" class="report-divider" />
            </li>
          </ul>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-file empty-icon"></i>
          <p>No reports have been created.</p>
        </div>
      </template>
    </pv-card>

    <meet-create-and-edit-dialog
      :item="meet"
      :visible="createAndEditDialogIsVisible"
      :edit="isEdit"
      @update:visible="(value) => (createAndEditDialogIsVisible = value)"
      @save-requested="onSaveRequested"
    />
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

.admin-info {
  grid-column: span 3;
  background: linear-gradient(
    135deg,
    rgba(255, 210, 0, 0.4) 0%,
    rgba(255, 223, 77, 0.3) 100%
  );
  padding: 25px;
  border-radius: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.admin-avatar {
  grid-column: 1 / 2;
}

.admin-details {
  grid-column: 2 / 3;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.admin-details p {
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

.teachers-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.meet-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.reports-card {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
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

.teachers-card .header-icon {
  color: #1976d2;
}

.meet-card .header-icon {
  color: #388e3c;
}

.reports-card .header-icon {
  color: #7b1fa2;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.teacher-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
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

.reports-list {
  list-style: none;
  padding: 16px;
  margin: 0;
}

.report-item {
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
}

.report-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.report-label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.report-value {
  color: #333;
  font-size: 14px;
  text-align: right;
}

.report-divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 12px 0;
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
