import Swal from "sweetalert2";

export const Alert = {
  success: (message, title = "Success!") => {
    return Swal.fire({
      icon: "success",
      title,
      text: message,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  },

  error: (message, title = "Error") => {
    return Swal.fire({
      icon: "error",
      title,
      text: message,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
    });
  },

  warning: (message, title = "Warning") => {
    return Swal.fire({
      icon: "warning",
      title,
      text: message,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
    });
  },

  confirm: (message, title = "Are you sure?") => {
    return Swal.fire({
      title,
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
  },

    prompt: ({ title, inputLabel, placeholder = "", required = false }) => {
    return Swal.fire({
      title,
      input: "text",
      inputLabel,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (required && !value) {
          return "This field is required.";
        }
        return null;
      }
    });
  },

  custom: (options = {}) => Swal.fire(options),
};
