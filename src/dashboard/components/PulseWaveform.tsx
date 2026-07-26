interface PulseWaveformProps {
  isLive: boolean;
  color?: string;
}

export default function PulseWaveform({ isLive, color = "#34D399" }: PulseWaveformProps) {
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" fill="none" className="shrink-0">
      <path
        d="M0 10 H18 L22 3 L27 17 L31 10 H64"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isLive ? 1 : 0.25}
        style={
          isLive
            ? {
                strokeDasharray: 90,
                strokeDashoffset: 90,
                animation: "pulse-draw 2.2s ease-in-out infinite",
              }
            : undefined
        }
      />
      <style>{`
        @keyframes pulse-draw {
          0% { stroke-dashoffset: 90; }
          45% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -90; }
        }
      `}</style>
    </svg>
  );
}