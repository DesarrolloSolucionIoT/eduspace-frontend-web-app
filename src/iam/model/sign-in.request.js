export class SignInRequest {
    constructor({ username = '', password = ''}) {
        this.password = password;
        this.username = username;
    }
}