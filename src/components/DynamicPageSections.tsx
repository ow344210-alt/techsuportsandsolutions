import { ArrowUpRight } from "lucide-react";
import { useDynamicPageSections } from "../hooks/useDynamicPageSections";
import Section from "./ui/Section";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

interface DynamicPageSectionsProps {
  page: string;
}

export default function DynamicPageSections({ page }: DynamicPageSectionsProps) {
  const { sections, loading } = useDynamicPageSections(page);

  if (loading || sections.length === 0) {
    return null;
  }

  return (
    <>
      {sections.map((section) => (
        <Section
          key={section.group.id}
          className="bg-[#07101D] text-white"
          decoration={<BackgroundDecorations preset="cards" />}
        >
          <div className="mb-12 max-w-3xl" data-aos="fade-up">
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">{section.group.group_title}</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {section.cards.map((card) => (
              <div
                key={card.id}
                data-aos="fade-up"
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
                    <p className="mt-3 flex-grow text-sm leading-7 text-gray-400">{card.description}</p>
                  )}

                  {card.link_url && (
                    <Button
                      href={card.link_url}
                      target={card.link_url.startsWith("http") ? "_blank" : undefined}
                      rel={card.link_url.startsWith("http") ? "noopener noreferrer" : undefined}
                      variant="ghost"
                      size="sm"
                      icon={<ArrowUpRight size={16} />}
                      className="mt-5 !px-0 !py-0 justify-start hover:gap-3"
                    >
                      Learn More
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </>
  );
}