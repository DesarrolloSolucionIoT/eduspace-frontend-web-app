// login.services.js
import http from '../../../shared/services/http-common.js';

export class LoginService {
    async signIn(signInRequest) {
        try {
            return http.post("/authentication/sign-in", signInRequest);
        } catch (error) {
            console.error("Sign in error:", error);
            throw error;
        }
    }
}
