import { create } from "zustand";

type ToastState = {
  message: string;
  hot: boolean;
  visible: boolean;
  show: (message: string, hot?: boolean) => void;
};

let hideTimer = 0;

export const useToast = create<ToastState>((set) => ({
  message: "",
  hot: false,
  visible: false,
  show(message, hot = false) {
    if (typeof window !== "undefined") window.clearTimeout(hideTimer);
    set({ message, hot, visible: true });
    if (typeof window !== "undefined") {
      hideTimer = window.setTimeout(() => set({ visible: false }), 1700);
    }
  }
}));

export function toast(message: string, hot = false) {
  useToast.getState().show(message, hot);
}
