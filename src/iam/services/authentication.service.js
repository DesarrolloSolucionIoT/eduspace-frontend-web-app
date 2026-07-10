import http from "../../shared/services/http-common.js";

export class AuthenticationService {
    signIn(signInRequest) {
        return http.post("/authentication/sign-in", signInRequest);
    }

    async signUp(signUpRequest) {
        const response = await http.post("/authentication/sign-up", signUpRequest);
        return response.data;
    }
}

export default new AuthenticationService();