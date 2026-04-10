import store from "../../store";

export function authenticationGuard(to, from, next) {
    const isAuthenticated = !!store.state.user.token;
    if (isAuthenticated) {
        next();
    } else {
        next({ name: "login" });
    }
}
