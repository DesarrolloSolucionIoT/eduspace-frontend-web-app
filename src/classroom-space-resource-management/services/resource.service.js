import http from "../../shared/services/http-common.js";

export class ResourceService {
    baseEndpoint = "/classrooms";
    resourcePath = "/resources";

    getAllByClassroomId(classroomId) {
        return http.get(`${this.baseEndpoint}/${classroomId}${this.resourcePath}`);
    }

    getById(classroomId, resourceId) {
        return http.get(`${this.baseEndpoint}/${classroomId}${this.resourcePath}/${resourceId}`);
    }

    create(classroomId, resourceData) {
        return http.post(`${this.baseEndpoint}/${classroomId}${this.resourcePath}`, resourceData);
    }

    update(classroomId, resourceId, resourceData) {
        return http.put(`${this.baseEndpoint}/${classroomId}${this.resourcePath}/${resourceId}`, resourceData);
    }

    delete(classroomId, resourceId) {
        return http.delete(`${this.baseEndpoint}/${classroomId}${this.resourcePath}/${resourceId}`);
    }
}

