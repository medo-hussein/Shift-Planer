import Swal from 'sweetalert2';

export const useToast = () => {

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  const addToast = (message, type = 'info', duration = 3000) => {
    Toast.fire({
      icon: type,
      title: message,
      timer: duration
    });
  };

  const removeToast = (id) => {
    // SweetAlert handles removal automatically
  };

  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'error', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);
  const info = (message, duration) => addToast(message, 'info', duration);

  // No-op component to maintain compatibility with existing code
  const ToastContainer = () => null;

  return {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer
  };
};
