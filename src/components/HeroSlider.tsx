// Premium homepage slider rendered below the Navbar. Falls back gracefully
// to the static Hero component when no admin-created slides exist yet, so
// the homepage is never empty.
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHeroSlides } from "../hooks/useHeroSlides";
import Button from "./ui/Button";
import Hero from "./Hero";

const AUTOPLAY_INTERVAL_MS = 6000;

function HeroSlider() {
  const { slides, loading } = useHeroSlides();
  const [activeIndex, setActiveIndex] = useState(0);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(goToNext, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length, goToNext]);

  if (loading) {
    return <div className="h-screen w-full animate-pulse bg-[#07101D]" />;
  }

  // No admin-created slides yet — fall back to the original static Hero
  if (slides.length === 0) {
    return <Hero />;
  }

  return (
    <section id="home" className="relative min-h-svh w-full overflow-hidden bg-[#07101D] text-white">
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              isActive ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
          >
            {/* Background media */}
            {slide.media_url && slide.media_type === "video" ? (
              <video
                src={slide.media_url}
                autoPlay={isActive}
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : slide.media_url ? (
              <img
                src={slide.media_url}
                alt={slide.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-950 to-pink-900" />
            )}

            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: slide.overlay_opacity }}
            />

            {/* Content */}
            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">
              <div
                className={`max-w-2xl transition-all duration-700 ${
                  isActive ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                {slide.subtitle && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-wide text-purple-300 backdrop-blur-lg">
                    {slide.subtitle}
                  </span>
                )}

                <h1 className="mt-8 text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                  {slide.title}
                </h1>

                {slide.description && (
                  <p className="mt-6 max-w-xl text-lg leading-8 text-gray-300">{slide.description}</p>
                )}

                {slide.button_text && (
                  <div className="mt-10">
                    {slide.button_link ? (
                      <Button href={slide.button_link} variant="primary" size="lg">
                        {slide.button_text}
                      </Button>
                    ) : (
                      <Button to="/contact" variant="primary" size="lg">
                        {slide.button_text}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Prev/Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-lg transition hover:bg-white/15 sm:left-8"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-lg transition hover:bg-white/15 sm:right-8"
          >
            <ChevronRight size={22} />
          </button>

          {/* Pagination dots */}
          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default HeroSlider;