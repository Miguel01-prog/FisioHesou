import Swal from "sweetalert2";

// Mostrar alerta de éxito
export const showSuccess = (title = "Éxito", text = "") => {
  Swal.fire({
    icon: "success",
    title,
    text,
    //timer: 2500,
    showConfirmButton: true,
    timerProgressBar: true,
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp'
    }
  });
};

// Mostrar alerta de error
export const showError = (title = "Error", text = "") => {
  Swal.fire({
    icon: "error",
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
    timerProgressBar: true,
  });
};

// Mostrar alerta informativa
export const showInfo = (title = "Info", text = "") => {
  Swal.fire({
    icon: "info",
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
    timerProgressBar: true,
  });
};

// Confirmación antes de acción
export const showConfirm = async (title = "¿Estás seguro?", text = "") => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "No",
  });

  return result.isConfirmed;
};
