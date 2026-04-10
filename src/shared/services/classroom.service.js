import http from "./http-common.js";

export class ClassroomService {
    endpoint = '/classrooms';

    getAll() {
        return http.get(this.endpoint);
    }

    getById(id) {
        return http.get(`${this.endpoint}/${id}`);
    }

    create(classroom, teacherId) {
        return http.post(`${this.endpoint}/teachers/${teacherId}`, classroom);
    }

    update(id, classroomResource) {
        return http.put(`${this.endpoint}/${id}`, classroomResource);
    }

    delete(id) {
        return http.delete(`${this.endpoint}/${id}`);
    }

    getByTeacherId(teacherId) {
        return http.get(`${this.endpoint}/teachers/${teacherId}`);
    }
}