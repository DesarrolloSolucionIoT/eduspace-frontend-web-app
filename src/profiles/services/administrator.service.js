import http from "../../shared/services/http-common.js";

export class AdministratorService {
    static resourceEndpoint = '/administrator-profiles';

    static async getAll() {
        try {
            const response = await http.get(this.resourceEndpoint);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "fetching administrators list");
        }
    }

    static async getById(administratorId) {
        try {
            const response = await http.get(`${this.resourceEndpoint}/${administratorId}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error(`Administrator with ID ${administratorId} not found`);
            }
            throw this.handleError(error, "fetching administrator");
        }
    }

    static async create(administratorData) {
        try {
            const response = await http.post(this.resourceEndpoint, administratorData);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "creating administrator");
        }
    }

    static async update(administratorId, administratorData) {
        try {
            const response = await http.put(
                `${this.resourceEndpoint}/${administratorId}`,
                administratorData
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "updating administrator");
        }
    }

    static async delete(administratorId) {
        try {
            const response = await http.delete(`${this.resourceEndpoint}/${administratorId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "deleting administrator");
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
                    data?.message || "Conflict: Administrator may already exist with this email, DNI or username."
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
