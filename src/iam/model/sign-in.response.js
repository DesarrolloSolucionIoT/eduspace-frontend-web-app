export class SignInResponse {
    constructor({id, username, role, token}) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.token = token;
    }
}