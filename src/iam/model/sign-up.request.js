export class SignUpRequest {
  constructor({
    firstName,
    lastName,
    email,
    dni,
    address,
    phone,
    username,
    password,
    birthdate,
  }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.dni = dni;
    this.address = address;
    this.phone = phone;
    this.username = username;
    this.password = password;
    this.birthdate = birthdate;
  }

  /**
   * Validates email format
   * @param {string} email
   * @returns {boolean}
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates Peruvian DNI format (8 digits)
   * @param {string} dni
   * @returns {boolean}
   */
  static validateDNI(dni) {
    const dniRegex = /^\d{8}$/;
    return dniRegex.test(dni);
  }

  /**
   * Validates Peruvian phone format (9 digits starting with 9)
   * @param {string} phone
   * @returns {boolean}
   */
  static validatePhone(phone) {
    const phoneRegex = /^9\d{8}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validates age (must be 18 or older)
   * @param {Date|string} birthdate
   * @returns {boolean}
   */
  static validateAge(birthdate) {
    if (!birthdate) return false;

    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Ajustar la edad si aún no ha cumplido años este año
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 18;
  }

  /**
   * Validates the request data
   * @returns {boolean} - True if all required fields are present and valid
   */
  isValid() {
    // Check required fields
    const hasRequiredFields = !!(
      this.firstName &&
      this.lastName &&
      this.email &&
      this.username &&
      this.password &&
      this.dni &&
      this.phone &&
      this.birthdate
    );

    if (!hasRequiredFields) {
      return false;
    }

    // Validate formats
    const isEmailValid = SignUpRequest.validateEmail(this.email);
    const isDNIValid = SignUpRequest.validateDNI(this.dni);
    const isPhoneValid = SignUpRequest.validatePhone(this.phone);
    const isAgeValid = SignUpRequest.validateAge(this.birthdate);

    return isEmailValid && isDNIValid && isPhoneValid && isAgeValid;
  }

  /**
   * Gets validation errors for the request
   * @returns {Object} - Object containing validation error messages
   */
  getValidationErrors() {
    const errors = {};

    if (!this.firstName) errors.firstName = "El nombre es requerido";
    if (!this.lastName) errors.lastName = "El apellido es requerido";
    if (!this.username) errors.username = "El nombre de usuario es requerido";
    if (!this.password) errors.password = "La contraseña es requerida";
    if (!this.address) errors.address = "La dirección es requerida";

    if (!this.email) {
      errors.email = "El email es requerido";
    } else if (!SignUpRequest.validateEmail(this.email)) {
      errors.email = "Ingrese un email válido";
    }

    if (!this.dni) {
      errors.dni = "El DNI es requerido";
    } else if (!SignUpRequest.validateDNI(this.dni)) {
      errors.dni = "El DNI debe tener exactamente 8 dígitos";
    }

    if (!this.phone) {
      errors.phone = "El teléfono es requerido";
    } else if (!SignUpRequest.validatePhone(this.phone)) {
      errors.phone = "El teléfono debe tener 9 dígitos y comenzar con 9";
    }

    if (!this.birthdate) {
      errors.birthdate = "La fecha de nacimiento es requerida";
    } else if (!SignUpRequest.validateAge(this.birthdate)) {
      errors.birthdate = "Debe ser mayor de 18 años";
    }

    return errors;
  }
}
