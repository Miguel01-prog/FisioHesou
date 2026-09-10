import Swal from "sweetalert2";

// Custom SweetAlert2 Mixin for Toast Notifications (Top Right)
export const showToast = (title = "", icon = "success") => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "var(--card-bg, #ffffff)",
    color: "var(--text-main, #0f172a)",
    customClass: {
      popup: "custom-toast-popup",
    },
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    }
  });

  Toast.fire({
    icon,
    title
  });
};

// Custom SweetAlert2 style defaults matching Amethyst / Teal design system
const customSwal = Swal.mixin({
  background: "var(--card-bg, #ffffff)",
  color: "var(--text-main, #0f172a)",
  buttonsStyling: false,
  customClass: {
    popup: "custom-swal-popup",
    title: "custom-swal-title",
    htmlContainer: "custom-swal-text",
    confirmButton: "btn btn-primary custom-swal-confirm-btn",
    cancelButton: "btn btn-secondary custom-swal-cancel-btn"
  }
});

// Mostrar alerta de éxito
export const showSuccess = (title = "Éxito", text = "") => {
  customSwal.fire({
    icon: "success",
    title,
    text,
    timer: 2800,
    showConfirmButton: true,
    confirmButtonText: "Entendido",
    timerProgressBar: true
  });
};

// Mostrar alerta de error
export const showError = (title = "Error", text = "") => {
  customSwal.fire({
    icon: "error",
    title,
    text,
    showConfirmButton: true,
    confirmButtonText: "Aceptar",
    timerProgressBar: true
  });
};

// Mostrar alerta informativa
export const showInfo = (title = "Información", text = "") => {
  customSwal.fire({
    icon: "info",
    title,
    text,
    timer: 3500,
    showConfirmButton: true,
    confirmButtonText: "Aceptar",
    timerProgressBar: true
  });
};

// Confirmación antes de acción
export const showConfirm = async (title = "¿Estás seguro?", text = "") => {
  const result = await customSwal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar"
  });

  return result.isConfirmed;
};
