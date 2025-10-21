import toast from "react-hot-toast";

interface ToastOptions {
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  duration?: number;
}

const defaultOptions: ToastOptions = {
  position: "top-right",
  duration: 3000,
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options });
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
};
