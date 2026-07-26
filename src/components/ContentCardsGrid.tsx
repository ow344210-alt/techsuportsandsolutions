import { ArrowUpRight } from "lucide-react";
import { useContentCards } from "../hooks/useContentCards";

interface ContentCardsGridProps {
  section: string;
}

export default function ContentCardsGrid({ section }: ContentCardsGridProps) {
  const { cards, loading } = useContentCards(section);

  if (loading) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="glass-card animate-pulse overflow-hidden">
            <div className="aspect-video w-full bg-white/5" />
            <div className="p-6">
              <div className="h-5 w-2/3 rounded bg-white/5" />
              <div className="mt-3 h-4 w-full rounded bg-white/5" />
              <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={card.id}
          data-aos="fade-up"
          data-aos-delay={index * 100}
          className="glass-card group flex h-full flex-col overflow-hidden"
        >
          {card.image_url && (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={card.image_url}
                alt={card.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex flex-1 flex-col p-6">
            <h3 className="text-xl font-bold text-white">{card.title}</h3>

            {card.description && (
              <p className="mt-3 flex-grow text-sm leading-7 text-gray-400">
                {card.description}
              </p>
            )}

            {card.link_url && (
              <a
                href={card.link_url}
                target={card.link_url.startsWith("http") ? "_blank" : undefined}
                rel={
                  card.link_url.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-purple-400 transition duration-300 hover:gap-3 hover:text-pink-400"
              >
                Learn More
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
