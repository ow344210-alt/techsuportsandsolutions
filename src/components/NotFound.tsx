import { Home, Mail, AlertTriangle } from "lucide-react";
import SEO from "./seo/SEO";
import Button from "./ui/Button";

export default function NotFound() {
  return (
    <>
      <SEO title="404 — Page Not Found" noIndex />
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-[300px] w-[300px] rounded-full bg-pink-500/10 blur-[150px]" />

      {/* Decorative background "404" */}
      <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[18rem] font-black text-white/[0.02] sm:text-[24rem]">
        404
      </span>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-600/20 to-pink-500/20 backdrop-blur-sm">
          <AlertTriangle size={40} className="text-purple-400" />
        </div>

        <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 sm:text-8xl md:text-9xl">
          404
        </h1>

        <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
          Page Not Found
        </h2>

        <p className="mt-4 max-w-md text-gray-400 sm:text-lg">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button to="/" size="md" icon={<Home size={18} />}>
            Back to Home
          </Button>

          <Button to="/contact" variant="secondary" size="md" icon={<Mail size={18} />}>
            Contact Support
          </Button>
        </div>
      </div>
     </div>
     </>
   );
 }