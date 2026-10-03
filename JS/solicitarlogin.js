// FUNCIÓN AUXILIAR: MUESTRA EL POPUP EN LUGAR DEL ALERT NATIVO
function mostrarAlerta(mensaje, esExito = false) {
    const modalElement = document.getElementById('alertModal');
    if (!modalElement) {
        alert(mensaje);
        return;
    }

    const alertMessage = document.getElementById('alertMessage');
    const alertTitleText = document.getElementById('alertTitleText');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitleContainer = document.getElementById('alertTitle');

    alertMessage.textContent = mensaje;

    if (esExito) {
        alertTitleText.textContent = "¡Éxito!";
        alertTitleContainer.className = "modal-title fw-bold w-100 text-center text-success";
        alertIcon.className = "bi bi-check-circle-fill me-2 text-success";
    } else {
        alertTitleText.textContent = "Atención";
        alertTitleContainer.className = "modal-title fw-bold w-100 text-center text-danger";
        alertIcon.className = "bi bi-exclamation-triangle-fill me-2 text-danger";
    }

    const alertModal = new bootstrap.Modal(modalElement);
    alertModal.show();
}

// VALIDACIÓN CLIENTE: INICIO DE SESIÓN
const formLogin = document.getElementById("formLogin");

if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("correo").value;
        const passwordElement = document.getElementById("loginPassword") || document.getElementById("password");
        const password = passwordElement.value;

        if (!email || !password) {
            mostrarAlerta("Por favor, ingresa tu correo y contraseña.");
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            mostrarAlerta("El formato del correo electrónico no es válido.");
            return;
        }

        mostrarAlerta("¡Inicio de sesión exitoso! (Simulación Frontend)", true);
        formLogin.reset();

        const modalElement = document.getElementById("loginModal");
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }
    });
}

// VALIDACIÓN CLIENTE: REGISTRO DE CUENTA
const formRegistro = document.getElementById("formRegistro");

if (formRegistro) {
    formRegistro.addEventListener("submit", function (e) {
        e.preventDefault();

        const nombre = document.getElementById("nombreCompleto").value;
        const dni = document.getElementById("dni").value;
        const direccion = document.getElementById("direccion").value;
        const email = document.getElementById("correo").value;
        const telefono = document.getElementById("telefono").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const terminos = document.getElementById("terminos").checked;

        // 1. Validar campos vacíos
        if (!nombre || !dni || !direccion || !email || !telefono || !password || !confirmPassword) {
            mostrarAlerta("Por favor, completa todos los campos del formulario.");
            return;
        }

        // 2. Validar formato de correo
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            mostrarAlerta("Por favor, ingresa un correo electrónico válido.");
            return;
        }

        // 3. Validar longitud exacta de DNI y Teléfono
        if (dni.length !== 8) {
            mostrarAlerta("El DNI debe tener exactamente 8 dígitos.");
            return;
        }

        if (telefono.length !== 9) {
            mostrarAlerta("El número de teléfono debe tener exactamente 9 dígitos.");
            return;
        }

        // 4. Validar contraseña robusta
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
        if (!passwordRegex.test(password)) {
            mostrarAlerta("La contraseña debe tener mínimo 6 caracteres, incluir una mayúscula, un número y un carácter especial.");
            return;
        }

        // 5. Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            mostrarAlerta("Las contraseñas no coinciden. Por favor, verifícalas.");
            return;
        }

        // 6. Validar términos
        if (!terminos) {
            mostrarAlerta("Debes aceptar los Términos y Condiciones para continuar.");
            return;
        }

        // Simulación de éxito disparando el modal de éxito existente en registro.html
        const modalExitoElement = document.getElementById("registroExitosoModal");
        if (modalExitoElement) {
            const modalExito = new bootstrap.Modal(modalExitoElement);
            modalExito.show();
        } else {
            mostrarAlerta("¡Cuenta creada exitosamente!", true);
        }

        formRegistro.reset();
    });
}