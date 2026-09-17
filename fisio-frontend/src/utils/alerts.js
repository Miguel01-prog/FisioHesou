import Swal from "sweetalert2";

// Toast Notifications (Top Right)
export const showToast = (title = "", icon = "success") => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
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

// Alertas clásicas de SweetAlert2 sin estilos ni clases personalizadas
export const showSuccess = (title = "Éxito", text = "") => {
  Swal.fire({
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
  Swal.fire({
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
  Swal.fire({
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
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar"
  });

  return result.isConfirmed;
};

