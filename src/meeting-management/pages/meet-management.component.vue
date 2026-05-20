<script>
import {Meet} from "../model/meet.entity.js";
import MeetCreateAndEditDialog from "../components/meet-create-and-edit.component.vue";
import {MeetService} from "../services/meet.service.js";
import {ClassroomService} from "../../shared/services/classroom.service.js";
import {AdministratorsService} from "../services/administrators.service.js";
import MeetingCard from "../components/meeting-card.vue";

export default {
  name: "meet-management",
  components: { MeetCreateAndEditDialog, MeetingCard },
  data() {
    return {
      title: { singular: "Meet", plural: "Meetings" },
      meetings: [],
      meet: new Meet({}),
      selectedMeetings: [],
      meetService: null,
      classroomsService: null,
      administratorsService: null,
      createAndEditDialogIsVisible: false,
      isEdit: false,
      submitted: false,
    };
  },
  methods: {
    notifySuccessfulAction(message) {
      this.$toast.add({
        severity: "success",
        summary: this.$t("common.success"),
        detail: message,
        life: 3000,
      });
    },
    notifyErrorAction(message) {
      this.$toast.add({
        severity: "error",
        summary: this.$t("common.error"),
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

        this.meetings = meetingsData.map((meetData) => {
          const classroom = allClassrooms.find(
            (c) => c.id == meetData.classroomId?.classroomIdentifier
          );
          const administrator = allAdministrators.find(
            (a) => a.id == meetData.administratorId?.administratorIdentifier
          );

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
      } catch (error) {
        console.error("Error loading and enriching meetings:", error);
        const errorMessage =
          error.userMessage || this.$t("meetingManagement.list.loadError");
        this.notifyErrorAction(errorMessage);
      }
    },

    onNewItem() {
      this.meet = new Meet({});
      this.isEdit = false;
      this.submitted = false;
      this.createAndEditDialogIsVisible = true;
    },
    onEditItem(item) {
      this.meet = JSON.parse(JSON.stringify(item));
      this.isEdit = true;
      this.submitted = false;
      this.createAndEditDialogIsVisible = true;
    },
    onDeleteItem(item) {
      this.meetService
        .delete(item.id)
        .then(() => {
          this.meetings = this.meetings.filter((m) => m.id !== item.id);
          this.notifySuccessfulAction(this.$t("meetingManagement.list.deleted"));
        })
        .catch((error) => {
          console.error("Error deleting meet:", error);
          const errorMessage =
            error.userMessage || this.$t("meetingManagement.list.deleteError");
          this.notifyErrorAction(errorMessage);
        });
    },
    onCancelRequested() {
      this.createAndEditDialogIsVisible = false;
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
        this.notifySuccessfulAction(this.$t("meetingManagement.create.success"));
        this.createAndEditDialogIsVisible = false;
      } catch (error) {
        console.error("Error creating meet:", error);
        const errorMessage =
          error.userMessage || this.$t("meetingManagement.create.error");
        this.notifyErrorAction(errorMessage);
      }
    },
    async updateMeet(payload) {
      try {
        const meetingId = payload.meetData.meetingId;

        payload.meetData.administratorId = payload.meetData.administratorId || this.meet.administrator?.id;
        payload.meetData.classroomId = payload.meetData.classroomId || this.meet.classroom?.id;

        await this.meetService.update(meetingId, payload.meetData);

        const originalTeacherIds = this.meet.teachers.map(t => t.id || t);
        const newTeacherIds = payload.teacherIds || [];

        const teachersToAdd = newTeacherIds.filter(id => !originalTeacherIds.includes(id));

        const teachersToRemove = originalTeacherIds.filter(id => !newTeacherIds.includes(id));

        const updatePromises = [];

        teachersToAdd.forEach(teacherId => {
          updatePromises.push(this.meetService.addTeacherToMeeting(meetingId, teacherId));
        });

        teachersToRemove.forEach(teacherId => {
          updatePromises.push(this.meetService.removeTeacherFromMeeting(meetingId, teacherId));
        });

        await Promise.all(updatePromises);

        await this.loadMeetings();
        this.notifySuccessfulAction(this.$t("meetingManagement.edit.success"));
        this.createAndEditDialogIsVisible = false;
      } catch (error) {
        console.error("Error updating meet:", error);
        const errorMessage =
          error.userMessage || this.$t("meetingManagement.edit.error");
        this.notifyErrorAction(errorMessage);
      }
    },
    onViewItem(meeting) {
      this.notifySuccessfulAction(
        this.$t("meetingManagement.list.viewing", {
          title: meeting.title || meeting.id,
        })
      );
    },
  },
  created() {
    this.meetService = new MeetService();
    this.classroomsService = new ClassroomService();
    this.administratorsService = new AdministratorsService();
    this.loadMeetings();
  },
};
</script>

<template>
  <div class="meet-management-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <i class="pi pi-calendar"></i>
        </div>
        <div class="header-text">
          <h1>{{ $t('meetingManagement.list.title') }}</h1>
          <p>{{ $t('meetingManagement.list.subtitle') }}</p>
        </div>
      </div>
    </div>

    <div class="meetings-list">
      <button class="p-button p-button-success" @click="onNewItem">
        {{ $t('meetingManagement.list.newMeeting') }}
      </button>
      <div v-if="meetings.length" class="cards">
        <MeetingCard
          v-for="meeting in meetings"
          :key="meeting.id"
          :meeting="meeting"
          @view="onViewItem"
          @edit="onEditItem"
          @delete="onDeleteItem"
        />
      </div>
      <div v-else>
        <p>{{ $t('meetingManagement.list.empty') }}</p>
      </div>
    </div>

    <meet-create-and-edit-dialog
      :item="meet"
      :visible="createAndEditDialogIsVisible"
      :edit="isEdit"
      @update:visible="(value) => (createAndEditDialogIsVisible = value)"
      @cancel-requested="onCancelRequested"
      @save-requested="onSaveRequested($event)"
    />

    <pv-toast />
  </div>
</template>

<style scoped>
.meet-management-page {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon i {
  font-size: 3rem;
  color: white;
}

.header-text h1 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 2rem;
  font-weight: 600;
}

.header-text p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
}

.meetings-list {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* small separation between MeetingCard components */
}
</style>
