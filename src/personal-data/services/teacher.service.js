import http from "../../shared/services/http-common.js";
import {RegisterTeacher} from "../model/register-teacher.entity.js";

export class TeacherService {
    static async fetchTeachers() {
        try {
            const response = await http.get("/teachers-profiles");
            return response.data;
        } catch (error) {
            throw this.handleError(error, "fetching teachers list");
        }
    }

    static async fetchTeacherById(teacherId) {
        try {
            const response = await http.get(`/teachers-profiles/${teacherId}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error(`Teacher with ID ${teacherId} not found`);
            }
            throw this.handleError(error, "fetching teacher");
        }
    }

    static async addTeacher(teacherData) {
        const registerTeacher = new RegisterTeacher(teacherData);

        if (!registerTeacher.isValid()) {
            const errors = registerTeacher.getValidationErrors();
            const errorMessages = Object.values(errors).join(", ");
            throw new Error(`Validation failed: ${errorMessages}`);
        }

        try {
            const response = await http.post("/teachers-profiles", registerTeacher);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "creating teacher");
        }
    }

    static async updateTeacher(teacherId, teacherData) {
        try {
            const response = await http.put(`/teachers-profiles/${teacherId}`, {
                firstName: teacherData.firstName,
                lastName: teacherData.lastName,
                email: teacherData.email,
                dni: teacherData.dni,
                address: teacherData.address,
                phone: teacherData.phone
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error, "updating teacher");
        }
    }

    static async deleteTeacher(teacherId) {
        try {
            const response = await http.delete(`/teachers-profiles/${teacherId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "deleting teacher");
        }
    }

    static handleError(error, action) {
        if (!error.response) {
            return new Error(`Network error while ${action}. Please check your connection.`);
        }

        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
            case 400:
                return new Error(
                    `Validation error: ${data?.message || "Invalid data provided"}`
                );

            case 401:
                return new Error("Unauthorized. Please log in again.");

            case 403:
                return new Error("You don't have permission to perform this action.");

            case 404:
                return new Error(`Resource not found while ${action}.`);

            case 409:
                return new Error(
                    data?.message || "Conflict: Teacher may already exist with this email, DNI or username."
                );

            case 500:
                return new Error(`Server error while ${action}. Please try again later.`);

            default:
                return new Error(
                    `Error while ${action}: ${data?.message || error.message || "Unknown error"}`
                );
        }
    }
}