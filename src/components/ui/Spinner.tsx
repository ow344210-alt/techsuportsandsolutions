export default function Spinner({ className = "", size = 24 }) {
  return (
    <div
      className={`animate-spin ${className}`}
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      <div className="h-full w-full rounded-full border border-white border-t-transparent" />
    </div>
  );
}