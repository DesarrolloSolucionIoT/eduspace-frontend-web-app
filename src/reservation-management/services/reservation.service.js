import http from "../../shared/services/http-common.js";

export class ReservationService {

    getAll() {
        return http.get('/reservations');
    }

    getById(id) {
        return http.get(`/reservations/${id}`);
    }

    create(teacherId, areaId, reservation) {
        return http.post(
            `/teachers/${teacherId}/areas/${areaId}/reservations`,
            reservation
        );
    }

    update(id, reservation) {
        return http.put(`/reservations/${id}`, {
            title: reservation.title,
            start: reservation.start,
            end: reservation.end
        });
    }

    delete(id) {
        return http.delete(`/reservations/${id}`);
    }

    findAllByAreaId(areaId) {
        return http.get(`/areas/${areaId}/reservations`);
    }
}