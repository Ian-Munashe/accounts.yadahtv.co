interface IModal {
  title?: string;
  description?: import("react").ReactNode;
  showCancel?: boolean;
  confirmText?: string;
  status?: "default" | "info" | "success" | "warning" | "danger";
  onConfirm?: () => void | Promise<void>;
}
