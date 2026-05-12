const WEB_APP_URL = "PEGA_AQUI_TU_URL_DE_APPS_SCRIPT";

const form = document.getElementById("raffleForm");
const submitButton = document.getElementById("submitButton");
const buttonText = document.getElementById("buttonText");
const messageBox = document.getElementById("messageBox");
const whatsappLink = document.getElementById("whatsappLink");

let sending = false;

function cleanPhone(value) {
  return value.replace(/[^\d+]/g, "").trim();
}

function setError(id, message) {
  document.getElementById(id + "Error").textContent = message || "";
}

function clearErrors() {
  ["fullName", "whatsapp", "city", "email"].forEach(function (id) {
    setError(id, "");
  });

  document.getElementById("termsError").textContent = "";
  document.getElementById("captchaError").textContent = "";
  messageBox.className = "";
  messageBox.textContent = "";
  whatsappLink.classList.remove("show");
}

function showMessage(type, message) {
  messageBox.className = type;
  messageBox.textContent = message;
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(data) {
  let valid = true;

  if (data.fullName.length < 3) {
    setError("fullName", "Ingresa tu nombre completo.");
    valid = false;
  }

  if (!/^\+?\d{8,15}$/.test(data.whatsapp)) {
    setError("whatsapp", "Ingresa un WhatsApp válido. Ejemplo: +593999999999");
    valid = false;
  }

  if (data.city.length < 2) {
    setError("city", "Ingresa tu ciudad.");
    valid = false;
  }

  if (!isValidEmail(data.email)) {
    setError("email", "Ingresa un correo válido.");
    valid = false;
  }

  if (!data.terms) {
    document.getElementById("termsError").textContent = "Debes aceptar los términos.";
    valid = false;
  }

  if (!data.recaptchaToken) {
    document.getElementById("captchaError").textContent = "Confirma que no eres un robot.";
    valid = false;
  }

  return valid;
}

function setLoading(status) {
  submitButton.disabled = status;
  buttonText.textContent = status ? "Enviando..." : "Participar ahora";
}

function createWhatsAppLink(phone, name) {
  const clean = phone.replace("+", "");
  const text = `Hola, soy ${name}. Confirmo mi registro para el Gran Sorteo de una Moto.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (sending) return;

  clearErrors();

  const data = {
    fullName: document.getElementById("fullName").value.trim(),
    whatsapp: cleanPhone(document.getElementById("whatsapp").value),
    city: document.getElementById("city").value.trim(),
    email: document.getElementById("email").value.trim(),
    terms: document.getElementById("terms").checked,
    marketingConsent: document.getElementById("marketingConsent").checked,
    recaptchaToken: typeof grecaptcha !== "undefined" ? grecaptcha.getResponse() : "",
    userAgent: navigator.userAgent
  };

  if (!validate(data)) return;

  sending = true;
  setLoading(true);

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "No se pudo completar el registro.");
    }

    showMessage("success", result.message || "Registro exitoso.");
    whatsappLink.href = createWhatsAppLink(data.whatsapp, data.fullName);
    whatsappLink.classList.add("show");

    form.reset();

    if (typeof grecaptcha !== "undefined") {
      grecaptcha.reset();
    }
  } catch (error) {
    showMessage("error", error.message || "Ocurrió un error. Intenta nuevamente.");
  } finally {
    sending = false;
    setLoading(false);
  }
});
