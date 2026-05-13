const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzTJ77W8Pls8AbOLokD_vlxaJeRfuOhNiUX1oX-DFqUQ_4D31_0lUs1Q3odRKTXa7X9/exec";

const form = document.getElementById("raffleForm");
const submitButton = document.getElementById("submitButton");
const buttonText = document.getElementById("buttonText");
const messageBox = document.getElementById("messageBox");
const whatsappLink = document.getElementById("whatsappLink");

let sending = false;

function cleanPhone(value) {
  return value.replace(/[^\d+]/g, "").trim();
}

function cleanDocumentId(value) {
  return value.replace(/[^\d]/g, "").trim();
}

function setError(id, message) {
  document.getElementById(id + "Error").textContent = message || "";
}

function clearErrors() {
  ["fullName", "whatsapp", "email", "documentId", "city", "parish"].forEach(function (id) {
    setError(id, "");
  });

  document.getElementById("termsError").textContent = "";
  // document.getElementById("captchaError").textContent = "";

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

  if (data.fullName.length < 6) {
    setError("fullName", "Ingresa tus nombres y apellidos completos.");
    valid = false;
  }

  if (!/^\+?\d{8,15}$/.test(data.whatsapp)) {
    setError("whatsapp", "Ingresa un celular o WhatsApp válido.");
    valid = false;
  }

  if (!isValidEmail(data.email)) {
    setError("email", "Ingresa un correo válido.");
    valid = false;
  }

  if (!/^\d{10}$/.test(data.documentId)) {
    setError("documentId", "Ingresa una cédula válida de 10 dígitos.");
    valid = false;
  }

  if (data.city !== "MILAGRO") {
    setError("city", "Selecciona tu ciudad.");
    valid = false;
  }

  if (!data.parish) {
    setError("parish", "Selecciona tu parroquia.");
    valid = false;
  }

  if (!data.terms) {
    document.getElementById("termsError").textContent = "Debes aceptar los términos.";
    valid = false;
  }

  /*
if (!data.recaptchaToken) {
  document.getElementById("captchaError").textContent = "Confirma que no eres un robot.";
  valid = false;
}
*/


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
    email: document.getElementById("email").value.trim(),
    documentId: cleanDocumentId(document.getElementById("documentId").value),
    city: document.getElementById("city").value,
    parish: document.getElementById("parish").value,
    terms: document.getElementById("terms").checked,
    marketingConsent: document.getElementById("marketingConsent").checked,
   recaptchaToken: "disabled",
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
