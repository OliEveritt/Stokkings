export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div
        style={{ width: size, height: size }}
        className="border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"
      />
    </div>
  );
}
