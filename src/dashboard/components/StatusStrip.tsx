import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext.types";
import PulseWaveform from "./PulseWaveform";

interface StatusStripProps {
  isLive: boolean;
}

export default function StatusStrip({ isLive }: StatusStripProps) {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });

  return (
    <div
      className={`mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border px-4 py-2.5 font-mono text-xs ${
        isDarkTheme ? "border-white/5 bg-black/20 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-emerald-500" : "bg-slate-500"}`} />
        <span className={isLive ? (isDarkTheme ? "text-emerald-400" : "text-emerald-600") : ""}>
          {isLive ? "LIVE" : "CONNECTING"}
        </span>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="opacity-60">SYSTEM</span>
        <span className={isDarkTheme ? "text-slate-200" : "text-slate-700"}>OPERATIONAL</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="opacity-60">LOCAL</span>
        <span className={isDarkTheme ? "text-slate-200" : "text-slate-700"}>{timeStr}</span>
      </div>

      <div className="ml-auto">
        <PulseWaveform isLive={isLive} color={isDarkTheme ? "#a78bfa" : "#7c3aed"} />
      </div>
    </div>
  );
}
