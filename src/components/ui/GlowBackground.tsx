// Standard purple/pink glow decoration used behind most dark sections.
// Extracted once instead of repeating the same two <div> blurs everywhere.
export default function GlowBackground() {
  return (
    <>
      <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[170px]" />
      <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-[170px]" />
    </>
  );
}