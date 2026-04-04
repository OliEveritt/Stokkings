"use client";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
}

const typeStyles: Record<string, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

export function Toast({ message, type = "info", visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`${typeStyles[type]} text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg`}
      >
        {message}
      </div>
    </div>
  );
}
