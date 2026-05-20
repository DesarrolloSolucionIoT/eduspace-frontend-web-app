import http from "../../../shared/services/http-common.js";
import {SignUpResponse} from "../../model/sign-up.response.js";

class RegisterService {
  static async registerAdministrator(signUpRequest) {
    if (!signUpRequest.isValid()) {
      const errors = signUpRequest.getValidationErrors();
      const errorMessages = Object.values(errors).join(", ");
      throw new Error(`Datos inválidos: ${errorMessages}`);
    }

    try {
      const response = await http.post(
        "/administrator-profiles",
        signUpRequest
      );
      return new SignUpResponse(response.data);
    } catch (error) {
      // http-common.js already extracts ProblemDetails / ValidationProblemDetails
      // (detail, errors, title, message) into error.userMessage. Use it so the
      // user sees the real backend reason instead of a generic fallback.
      const detail =
        error.userMessage ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Error desconocido";

      if (error.response?.status === 400) {
        throw new Error("Error de validación: " + detail);
      }
      throw new Error("Error al registrar: " + detail);
    }
  }
}

export default RegisterService;
