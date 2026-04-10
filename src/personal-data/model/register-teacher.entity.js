export class RegisterTeacher {
    constructor({
                    firstName,
                    lastName,
                    email,
                    dni,
                    address,
                    phone,
                    administratorId,
                    username,
                    password,
                }) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.dni = dni;
        this.address = address;
        this.phone = phone;
        this.administratorId = administratorId;
        this.username = username;
        this.password = password;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateDNI(dni) {
        const dniRegex = /^\d{8}$/;
        return dniRegex.test(dni);
    }

    static validatePhone(phone) {
        const phoneRegex = /^9\d{8}$/;
        return phoneRegex.test(phone);
    }

    static validateUsername(username) {
        return username && username.length >= 3 && username.length <= 20;
    }

    static validatePassword(password) {
        return password && password.length >= 6;
    }

    isValid() {
        const hasRequiredFields = !!(
            this.firstName &&
            this.lastName &&
            this.email &&
            this.username &&
            this.password &&
            this.dni &&
            this.phone &&
            this.address &&
            this.administratorId !== null &&
            this.administratorId !== undefined
        );

        if (!hasRequiredFields) {
            return false;
        }

        const isEmailValid = RegisterTeacher.validateEmail(this.email);
        const isDNIValid = RegisterTeacher.validateDNI(this.dni);
        const isPhoneValid = RegisterTeacher.validatePhone(this.phone);
        const isUsernameValid = RegisterTeacher.validateUsername(this.username);
        const isPasswordValid = RegisterTeacher.validatePassword(this.password);

        return (
            isEmailValid &&
            isDNIValid &&
            isPhoneValid &&
            isUsernameValid &&
            isPasswordValid
        );
    }

    getValidationErrors() {
        const errors = {};

        if (!this.firstName) errors.firstName = "First name is required";
        if (!this.lastName) errors.lastName = "Last name is required";
        if (!this.address) errors.address = "Address is required";
        if (this.administratorId === null || this.administratorId === undefined) {
            errors.administratorId = "Administrator ID is required";
        }

        if (!this.email) {
            errors.email = "Email is required";
        } else if (!RegisterTeacher.validateEmail(this.email)) {
            errors.email = "Enter a valid email (e.g.: user@domain.com)";
        }

        if (!this.dni) {
            errors.dni = "DNI is required";
        } else if (!RegisterTeacher.validateDNI(this.dni)) {
            errors.dni = "DNI must be exactly 8 digits";
        }

        if (!this.phone) {
            errors.phone = "Phone is required";
        } else if (!RegisterTeacher.validatePhone(this.phone)) {
            errors.phone = "Phone must be 9 digits and start with 9";
        }

        if (!this.username) {
            errors.username = "Username is required";
        } else if (!RegisterTeacher.validateUsername(this.username)) {
            errors.username = "Username must be 3-20 characters";
        }

        if (!this.password) {
            errors.password = "Password is required";
        } else if (!RegisterTeacher.validatePassword(this.password)) {
            errors.password = "Password must be at least 6 characters";
        }

        return errors;
    }

    toJSON() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            dni: this.dni,
            address: this.address,
            phone: this.phone,
            administratorId: this.administratorId,
            username: this.username,
            password: this.password,
        };
    }
}