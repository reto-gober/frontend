import Swal from 'sweetalert2';

/**
 * Servicio centralizado de notificaciones usando SweetAlert2
 * Reemplaza todos los alert(), confirm() y prompt() nativos
 */

// Configuración de tema minimalista personalizado
const swalConfig = {
  customClass: {
    popup: 'swal-popup-custom',
    title: 'swal-title-custom',
    htmlContainer: 'swal-text-custom',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
    icon: 'swal-icon-custom',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'swal-show',
  },
  hideClass: {
    popup: 'swal-hide',
  },
};

/**
 * Notificación de éxito
 */
export const notifySuccess = (message: string, title: string = '¡Éxito!') => {
  return Swal.fire({
    ...swalConfig,
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'Aceptar',
    timer: 3000,
    timerProgressBar: true,
  });
};

/**
 * Notificación de error
 */
export const notifyError = (message: string, title: string = 'Error') => {
  return Swal.fire({
    ...swalConfig,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Notificación de advertencia
 */
export const notifyWarning = (message: string, title: string = 'Advertencia') => {
  return Swal.fire({
    ...swalConfig,
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Notificación de información
 */
export const notifyInfo = (message: string, title: string = 'Información') => {
  return Swal.fire({
    ...swalConfig,
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'Aceptar',
    timer: 3000,
    timerProgressBar: true,
  });
};

/**
 * Modal de confirmación (reemplaza confirm())
 * Retorna una Promise que resuelve a true si el usuario confirma, false si cancela
 */
export const notifyConfirm = async (
  message: string,
  title: string = '¿Estás seguro?',
  confirmText: string = 'Sí, continuar',
  cancelText: string = 'Cancelar'
): Promise<boolean> => {
  const result = await Swal.fire({
    ...swalConfig,
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });

  return result.isConfirmed;
};

/**
 * Toast ligero para notificaciones no intrusivas
 */
export const notifyToast = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration: number = 3000
) => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    customClass: {
      popup: 'swal-toast-custom',
    },
  });
};

/**
 * Modal de loading (útil para operaciones largas)
 */
export const notifyLoading = (message: string = 'Cargando...') => {
  return Swal.fire({
    ...swalConfig,
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * Cerrar el modal actual
 */
export const closeNotification = () => {
  Swal.close();
};

// Exportación por defecto como objeto con todos los métodos
const notifications = {
  success: notifySuccess,
  error: notifyError,
  warning: notifyWarning,
  info: notifyInfo,
  confirm: notifyConfirm,
  toast: notifyToast,
  loading: notifyLoading,
  close: closeNotification,
};

export default notifications;
