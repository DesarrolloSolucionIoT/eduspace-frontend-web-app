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
      // Handle specific validation errors from server
      if (error.response && error.response.status === 400) {
        throw new Error(
          "Error de validación: " +
            (error.response.data.message || "Datos inválidos")
        );
      }
      throw new Error(
        "Error al registrar: " + (error.message || "Error desconocido")
      );
    }
  }
}

export default RegisterService;
