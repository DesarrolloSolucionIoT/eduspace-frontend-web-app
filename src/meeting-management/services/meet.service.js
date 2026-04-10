import http from "../../shared/services/http-common.js";

export class MeetService {
    resourceEndpoint = '/meetings';

    getAll() {
        return http.get(this.resourceEndpoint);
    }

    getById(id) {
        return http.get(`${this.resourceEndpoint}/${id}`);
    }

    getAllByTeacherId(teacherId) {
        return http.get(`/teachers/${teacherId}/meetings`);
    }

    delete(id) {
        return http.delete(`${this.resourceEndpoint}/${id}`);
    }

    create(administratorId, classroomId, meetResource) {
        const url = `/administrators/${administratorId}/classrooms/${classroomId}/meetings`;
        return http.post(url, meetResource);
    }

    update(id, meetResource) {
        const url = `${this.resourceEndpoint}/${id}`;
        return http.put(url, meetResource);
    }

    addTeacherToMeeting(meetingId, teacherId) {
        const url = `${this.resourceEndpoint}/${meetingId}/teachers/${teacherId}`;
        return http.post(url, {});
    }

    removeTeacherFromMeeting(meetingId, teacherId) {
        const url = `${this.resourceEndpoint}/${meetingId}/teachers/${teacherId}`;
        return http.delete(url);
    }
}