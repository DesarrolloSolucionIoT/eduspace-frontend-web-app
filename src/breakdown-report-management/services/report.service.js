import http from "../../shared/services/http-common.js";

export class ReportService {
    resourceEndpoint = '/reports';

    getAll() {
        return http.get(this.resourceEndpoint);
    }

    getById(id) {
        return http.get(`${this.resourceEndpoint}/${id}`);
    }

    getByResourceId(resourceId) {
        return http.get(`${this.resourceEndpoint}/resources/${resourceId}`);
    }

    create(reportData) {
        return http.post(this.resourceEndpoint, reportData);
    }

    update(id, reportData) {
        return http.put(`${this.resourceEndpoint}/${id}`, {
            kindOfReport: reportData.kindOfReport,
            description: reportData.description,
            status: reportData.status
        });
    }

    delete(id) {
        return http.delete(`${this.resourceEndpoint}/${id}`);
    }
}