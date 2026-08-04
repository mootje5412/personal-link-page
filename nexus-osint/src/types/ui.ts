export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}
