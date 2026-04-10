import http from "../../shared/services/http-common.js";

export class SharedAreaService {
    endpoint = '/shared-area'

    getAll() {
        return http.get(this.endpoint);
    }

    getById(id) {
        return http.get(`${this.endpoint}/${id}`);
    }

    create(space) {
        return http.post(this.endpoint, space);
    }

    update(id, space) {
        return http.put(`${this.endpoint}/${id}`, space);
    }

    delete(id) {
        return http.delete(`${this.endpoint}/${id}`);
    }

    findAllByAreaId(areaId) {
        return http.get(`${this.endpoint}?areaId=${areaId}`)
    }
}