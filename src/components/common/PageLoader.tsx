import Spinner from "../ui/Spinner";

interface PageLoaderProps {
  mode?: "full" | "inline";
  text?: string;
  className?: string;
}

export default function PageLoader({ mode = "full", text, className }: PageLoaderProps) {
  if (mode === "inline") {
    return (
      <div className={`flex items-center justify-center py-10 ${className || ""}`}>
        <Spinner size={24} className="text-purple-400" />
        {text ? <span className="ml-3 text-sm text-gray-300">{text}</span> : null}
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen items-center justify-center bg-[#08101D] text-white ${className || ""}`}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} className="text-purple-400" />
        {text ? <span className="text-sm text-gray-300">{text}</span> : null}
      </div>
    </div>
  );
}
