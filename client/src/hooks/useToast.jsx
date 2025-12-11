import { useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';

export const useToast = () => {

  const Toast = useMemo(() => Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  }), []);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    Toast.fire({
      icon: type,
      title: message,
      timer: duration
    });
  }, [Toast]);

  const removeToast = useCallback((id) => {
    // SweetAlert handles removal automatically
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

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
